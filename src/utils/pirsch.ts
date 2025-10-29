import log from "loglevel";

function getAccessToken() {
  var clientId = import.meta.env.PIRSCH_CLIENT_ID;
  var clientSecret = import.meta.env.PIRSCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Pirsch credentials not found");
  }

  return fetch("https://api.pirsch.io/api/v1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
}

async function getDomainId(accessToken, hostname) {
  var response = await fetch("https://api.pirsch.io/api/v1/domain", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    var responseBody = await response.text();
    log.error("Failed to get domains from Pirsch:", responseBody);
    return null;
  }

  var domains = await response.json();

  for (var i = 0; i < domains.length; i++) {
    if (domains[i].hostname === hostname) {
      return domains[i].id;
    }
  }

  log.error("No matching domain found for hostname:", hostname);
  return null;
}

function getPageViewsForPath(accessToken, domainId, path) {
  var today = new Date();

  var to = today.toISOString().split("T")[0];

  var url = new URL("https://api.pirsch.io/api/v1/statistics/page");
  url.searchParams.append("id", domainId);
  url.searchParams.append("to", to);
  url.searchParams.append("path", path);

  return fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getBlogPostViews(hostname, path) {
  try {
    var responseBody;
    var tokenResponse = await getAccessToken();

    if (!tokenResponse.ok) {
      responseBody = await tokenResponse.text();
      log.error("Failed to get Pirsch access token:", responseBody);
      return 0;
    }

    var tokenData = await tokenResponse.json();
    var accessToken = tokenData.access_token;

    var domainId = await getDomainId(accessToken, hostname);

    if (!domainId) {
      return 0;
    }

    var statsResponse = await getPageViewsForPath(accessToken, domainId, path);

    if (!statsResponse.ok) {
      responseBody = await statsResponse.text();
      log.error("Failed to get page views from Pirsch:", responseBody);
      return 0;
    }

    var stats = await statsResponse.json();

    if (stats && stats.length > 0) {
      return stats[0].views || 0;
    }

    return 0;
  } catch (error) {
    log.error("Error fetching Pirsch data:", error);
    return 0;
  }
}
