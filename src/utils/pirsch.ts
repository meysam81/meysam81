import log from "./logging";
import httpClient from "./httpclient";

function getAccessToken() {
  var clientId = import.meta.env.PIRSCH_CLIENT_ID;
  var clientSecret = import.meta.env.PIRSCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Pirsch credentials not found");
  }

  return httpClient.post("https://api.pirsch.io/api/v1/token", {
    json: {
      client_id: clientId,
      client_secret: clientSecret,
    },
  });
}

async function getDomainId(accessToken, hostname) {
  var response = await httpClient.get("https://api.pirsch.io/api/v1/domain", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    var responseBody = await response.text();
    log.error("Failed to get domains from Pirsch:", responseBody);
    return null;
  }

  var domains: Array<{ id: string; hostname: string }> = await response.json();

  for (var i = 0; i < domains.length; i++) {
    if (domains[i].hostname === hostname) {
      return domains[i].id;
    }
  }

  log.error("No matching domain found for hostname:", hostname);
  return null;
}

function escapeRegexSpecialChars(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getPageViewsForPath(accessToken, domainId, path) {
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var startDate = new Date();
  startDate.setFullYear(2000, 0, 1);

  var to = tomorrow.toISOString().split("T")[0];
  var from = startDate.toISOString().split("T")[0];

  var url = new URL("https://api.pirsch.io/api/v1/statistics/page");
  url.searchParams.append("id", domainId);
  url.searchParams.append("to", to);
  url.searchParams.append("from", from);

  var escapedPath = escapeRegexSpecialChars(path);
  var pattern = "(?i)^" + escapedPath + "(?:\\?.*)?$";

  url.searchParams.append("pattern", pattern);

  return httpClient.get(url.toString(), {
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

    var tokenData: { access_token: string } = await tokenResponse.json();
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

    var stats: Array<{ path: string; views: number }> =
      await statsResponse.json();

    if (stats && stats.length > 0) {
      var pathViewsMap: { [key: string]: number } = {};
      var totalViews = 0;
      for (var i = 0; i < stats.length; i++) {
        var views = stats[i].views || 0;
        pathViewsMap[stats[i].path] = views;
        totalViews += views;
      }
      return totalViews;
    }

    return 0;
  } catch (error) {
    log.error("Error fetching Pirsch data:", error);
    return 0;
  }
}
