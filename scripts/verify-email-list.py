#!/usr/bin/env python3

import argparse
import csv
import logging
import os
import sys
import tempfile
import time

import requests


def setup_logger():
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)

    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    handler.setFormatter(formatter)

    logger.addHandler(handler)

    return logger


logger = setup_logger()


def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-o", "--original", required=False, help="Path to original CSV file"
    )
    parser.add_argument(
        "-r", "--result", required=False, help="Path to result CSV file"
    )
    parser.add_argument(
        "-k",
        "--api-key",
        default=os.environ.get("EMAILLISTVERIFY_API_KEY"),
        help="EmailListVerify API key",
    )
    parser.add_argument(
        "-q",
        "--quality",
        default="standard",
        choices=["standard", "high"],
        help="Verification quality (standard or high)",
    )
    parser.add_argument(
        "-p",
        "--poll-interval",
        type=int,
        default=10,
        help="Polling interval in seconds (default: 10)",
    )
    parser.add_argument(
        "--skip-compare",
        default=False,
        action="store_true",
        help="Skip comparison between original and result files",
    )
    parser.add_argument(
        "--listmonk-host",
        default=os.environ.get("LISTMONK_HOST"),
        help="Listmonk instance host (example: https://newsletter.example.com)",
    )
    parser.add_argument(
        "--listmonk-username",
        default=os.environ.get("LISTMONK_USERNAME"),
        help="Listmonk API username",
    )
    parser.add_argument(
        "--listmonk-password",
        default=os.environ.get("LISTMONK_PASSWORD"),
        help="Listmonk API password",
    )
    parser.add_argument(
        "--skip-cleanup",
        default=False,
        action="store_true",
        help="Skip cleanup of temporary files",
    )
    return parser.parse_args()


def validate_inputs(args):
    if not args.original and not args.listmonk_username:
        logger.error(
            "Either original file or Listmonk credentials (--listmonk-username) must be provided"
        )
        sys.exit(1)

    if args.original and not os.path.exists(args.original):
        logger.error(f"Original file '{args.original}' does not exist")
        sys.exit(1)

    if args.result and not os.path.exists(args.result):
        logger.error(f"Result file '{args.result}' does not exist")
        sys.exit(1)

    if not args.result and not args.api_key:
        logger.error("API key is required when result file is not provided")
        sys.exit(1)

    if not args.original and not (
        args.listmonk_username and args.listmonk_password and args.listmonk_host
    ):
        logger.error("Listmonk password is required when username is provided")
        sys.exit(1)


def read_original_emails(filepath):
    with open(filepath) as f:
        original_reader = csv.DictReader(f)
        return {row["email"] for row in original_reader}


def read_result_emails(filepath):
    with open(filepath) as f:
        result_reader = csv.DictReader(f)
        return {row["email"]: row["ELV Result"] for row in result_reader}


def fetch_subscribers_from_listmonk(host, username, password):
    url = f"{host.rstrip('/')}/api/subscribers"
    params = {"per_page": "all"}

    try:
        logger.info(f"Fetching subscribers from Listmonk instance: {host}")
        response = requests.get(
            url, auth=(username, password), params=params, verify=True
        )

        if response.status_code != 200:
            logger.error(
                f"Error fetching subscribers: {response.status_code} - {response.text}"
            )
            sys.exit(1)

        data = response.json()
        subscribers = data.get("data", {}).get("results", [])

        logger.info(f"Retrieved {len(subscribers)} subscribers from Listmonk")
        return subscribers

    except Exception as e:
        logger.error(f"Error fetching subscribers from Listmonk: {str(e)}")
        sys.exit(1)


def create_csv_from_subscribers(subscribers):
    temp_file = tempfile.NamedTemporaryFile(
        mode="w", delete=False, suffix=".csv", newline=""
    )

    try:
        writer = csv.DictWriter(temp_file, fieldnames=["email", "name"])
        writer.writeheader()

        for subscriber in subscribers:
            writer.writerow(
                {
                    "email": subscriber.get("email", ""),
                    "name": subscriber.get("name", ""),
                }
            )

        temp_file.close()
        logger.info(f"Created temporary CSV file: {temp_file.name}")
        return temp_file.name

    except Exception as e:
        temp_file.close()
        os.unlink(temp_file.name)
        logger.error(f"Error creating CSV from subscribers: {str(e)}")
        sys.exit(1)


def upload_email_list(filepath, api_key, quality):
    url = "https://api.emaillistverify.com/api/verifyApiFile"
    headers = {"x-api-key": api_key}

    try:
        with open(filepath, "rb") as f:
            files = {"file_contents": f}
            data = {"quality": quality}
            response = requests.post(
                url, headers=headers, files=files, data=data, verify=False
            )

            if response.status_code == 201:
                return response.text.strip()
            else:
                logger.error(
                    f"Error uploading file: {response.status_code} - {response.text}"
                )
                sys.exit(1)
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        sys.exit(1)


def poll_batch_job(job_id, api_key, poll_interval):
    url = f"https://api.emaillistverify.com/api/maillists/{job_id}/progress"
    headers = {"x-api-key": api_key}

    logger.info(f"Batch job created with ID: {job_id}")
    logger.info("Polling for completion...")

    while True:
        try:
            response = requests.get(url, headers=headers, verify=False)

            if response.status_code != 200:
                logger.error(
                    f"Error polling job: {response.status_code} - {response.text}"
                )
                sys.exit(1)

            result = response.json()
            status = result.get("status")
            progress = result.get("progress", 0)

            logger.info(f"Status: {status}, Progress: {progress}%")

            if status == "finished":
                logger.info("Batch job completed successfully!")
                return result
            elif status == "error":
                logger.error("Batch job encountered an error")
                sys.exit(1)

            time.sleep(poll_interval)

        except Exception as e:
            logger.error(f"Error polling job: {str(e)}")
            sys.exit(1)


def download_result_file(job_id, api_key, original_filepath):
    url = f"https://api.emaillistverify.com/api/maillists/{job_id}"
    headers = {"x-api-key": api_key}
    params = {
        "addResult": "true",
        "addOriginal": "true",
        "addDuplicates": "false",
        "addNoEmailRows": "false",
        "format": "csv",
    }

    try:
        response = requests.get(url, headers=headers, params=params, verify=False)

        if response.status_code != 200:
            logger.error(
                f"Error downloading result: {response.status_code} - {response.text}"
            )
            sys.exit(1)

        output_filepath = original_filepath.rsplit(".", 1)[0] + "_verified.csv"
        with open(output_filepath, "wb") as f:
            f.write(response.content)

        logger.info(f"Result saved to: {output_filepath}")
        return output_filepath

    except Exception as e:
        logger.error(f"Error downloading result: {str(e)}")
        sys.exit(1)


def compare_with_result_file(original_emails, result_filepath):
    result_emails = read_result_emails(result_filepath)
    for email in original_emails:
        if email not in result_emails:
            logger.info(email)


def verify_emails_with_batch(original_filepath, api_key, quality, poll_interval):
    job_id = upload_email_list(original_filepath, api_key, quality)
    poll_batch_job(job_id, api_key, poll_interval)
    return download_result_file(job_id, api_key, original_filepath)


def main():
    args = parse_arguments()
    validate_inputs(args)

    temp_csv_file = None

    if args.original:
        original_filepath = args.original
    else:
        subscribers = fetch_subscribers_from_listmonk(
            args.listmonk_host, args.listmonk_username, args.listmonk_password
        )
        temp_csv_file = create_csv_from_subscribers(subscribers)
        original_filepath = temp_csv_file

    try:
        original_emails = read_original_emails(original_filepath)

        if args.result:
            compare_with_result_file(original_emails, args.result)
        else:
            result_filepath = verify_emails_with_batch(
                original_filepath, args.api_key, args.quality, args.poll_interval
            )
            if not args.skip_compare:
                compare_with_result_file(original_emails, result_filepath)
    finally:
        if not args.skip_cleanup and temp_csv_file and os.path.exists(temp_csv_file):
            os.unlink(temp_csv_file)
            logger.info(f"Cleaned up temporary file: {temp_csv_file}")


if __name__ == "__main__":
    main()
