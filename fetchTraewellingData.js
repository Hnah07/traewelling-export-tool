/**
 * Script to fetch user statuses from Traewelling API and export them in the official format
 * This script requires a .env file with an API_TOKEN for authentication
 */

const https = require("https"); // To make HTTP requests
const fs = require("fs"); // To save the data to a file
require("dotenv").config(); // Load environment variables from .env file

// Get the API token from environment variables
const API_TOKEN = process.env.API_TOKEN;

if (!API_TOKEN) {
  console.error("Please set your API_TOKEN in the .env file");
  process.exit(1);
}

/**
 * Helper function to make HTTP GET requests to the Traewelling API
 * @param {string} url - The API endpoint URL
 * @param {Object} params - Query parameters to append to the URL
 * @returns {Promise<Object>} - The parsed JSON response
 */
function fetchJSON(url, params = {}) {
  return new Promise((resolve, reject) => {
    // Add query parameters to URL if any
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url = `${url}?${queryString}`;
    }

    const options = {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        Accept: "application/json",
      },
    };

    console.log("Making request to:", url);
    console.log("With headers:", JSON.stringify(options.headers, null, 2));

    https
      .get(url, options, (res) => {
        let data = ""; // Initialize an empty string to store incoming data chunks

        console.log("Response status:", res.statusCode);
        console.log("Response headers:", JSON.stringify(res.headers, null, 2));

        // If the server returns any HTTP status code other than 200 (OK), reject the promise with an error
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} when fetching ${url}`));
        }

        // Collect the incoming data chunks as they arrive
        res.on("data", (chunk) => (data += chunk));

        // Once the response ends, try to parse the full response string into JSON
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", (err) => reject(err));
  });
}

/**
 * Main function to fetch user data and statuses
 * This function:
 * 1. Fetches the authenticated user's profile
 * 2. Retrieves all statuses using pagination
 * 3. Formats the data according to Traewelling's export format
 * 4. Saves the data to a JSON file
 */
async function run() {
  try {
    // First get the authenticated user's profile
    console.log("Fetching authenticated user profile...");
    const userProfile = await fetchJSON(
      "https://traewelling.de/api/v1/auth/user"
    );
    console.log("User profile:", JSON.stringify(userProfile, null, 2));

    const userId = userProfile.data.id;
    const username = userProfile.data.username;
    console.log(`\nFound user ID: ${userId}, username: ${username}`);

    // Get your statuses with pagination
    let page = 1;
    let allStatuses = [];
    let hasMorePages = true;

    while (hasMorePages) {
      console.log(`\nFetching page ${page} of your statuses...`);
      try {
        // Use the user statuses endpoint with only username and page
        const statusesResponse = await fetchJSON(
          `https://traewelling.de/api/v1/user/${username}/statuses`,
          {
            page: page,
          }
        );

        if (!statusesResponse.data || !Array.isArray(statusesResponse.data)) {
          console.error("Unexpected response format:", statusesResponse);
          break;
        }

        const pageStatuses = statusesResponse.data;
        allStatuses = allStatuses.concat(pageStatuses);

        // Check if there are more pages based on the response
        hasMorePages = pageStatuses.length > 0; // Continue if we got any statuses
        page++;

        console.log(
          `Retrieved ${pageStatuses.length} statuses from page ${page - 1}`
        );

        // Add a small delay between requests to be nice to the API
        if (hasMorePages) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error(`Error fetching page ${page}:`, err.message);
        break;
      }
    }

    console.log(`\nFound ${allStatuses.length} statuses`);
    if (allStatuses.length > 0) {
      console.log("Sample status:", JSON.stringify(allStatuses[0], null, 2));

      // Get the date range of the statuses
      const dates = allStatuses.map((s) => new Date(s.createdAt));
      const earliest = new Date(Math.min(...dates));
      const latest = new Date(Math.max(...dates));

      console.log(`\nDate range of statuses:`);
      console.log(`Earliest: ${earliest.toISOString()}`);
      console.log(`Latest: ${latest.toISOString()}`);

      // Count statuses by month for statistics
      const monthCounts = {};
      dates.forEach((date) => {
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      });

      console.log("\nStatuses by month:");
      Object.entries(monthCounts)
        .sort()
        .forEach(([month, count]) => {
          console.log(`${month}: ${count} statuses`);
        });

      // Format the data to match Traewelling's official export format
      const exportData = {
        meta: {
          user: {
            id: userProfile.data.id,
            displayName: userProfile.data.displayName,
            username: userProfile.data.username,
            profilePicture: userProfile.data.profilePicture,
            trainDistance: userProfile.data.trainDistance,
            totalDistance: userProfile.data.trainDistance,
            trainDuration: userProfile.data.trainDuration,
            totalDuration: userProfile.data.trainDuration,
            points: userProfile.data.points,
            mastodonUrl: userProfile.data.mastodonUrl,
            privateProfile: userProfile.data.privateProfile,
            preventIndex: userProfile.data.preventIndex,
            likes_enabled: userProfile.data.likes_enabled,
            pointsEnabled: true,
            userInvisibleToMe: false,
            muted: false,
            following: false,
            followPending: false,
            followedBy: false,
          },
          from: earliest.toISOString(),
          to: latest.toISOString(),
          exportedAt: new Date().toISOString(),
        },
        data: allStatuses.map((status) => ({
          status: {
            id: status.id,
            body: status.body || "",
            bodyMentions: status.bodyMentions || [],
            user: status.user,
            username: status.username,
            profilePicture: status.profilePicture,
            preventIndex: status.preventIndex,
            business: status.business,
            visibility: status.visibility,
            likes: status.likes,
            liked: status.liked,
            isLikable: status.isLikable,
            client: status.client,
            createdAt: status.createdAt,
            train: status.train,
            event: status.event,
            userDetails: status.userDetails,
            tags: status.tags || [],
          },
          trip: {
            id: status.train.trip,
            category: status.train.category,
            number: status.train.number,
            lineName: status.train.lineName,
            journeyNumber: status.train.journeyNumber,
            origin: {
              id: status.train.origin.id,
              name: status.train.origin.name,
              latitude: status.train.origin.latitude,
              longitude: status.train.origin.longitude,
              ibnr: status.train.origin.ibnr,
              rilIdentifier: status.train.origin.rilIdentifier,
            },
            destination: {
              id: status.train.destination.id,
              name: status.train.destination.name,
              latitude: status.train.destination.latitude,
              longitude: status.train.destination.longitude,
              ibnr: status.train.destination.ibnr,
              rilIdentifier: status.train.destination.rilIdentifier,
            },
            stopovers: status.train.stopovers || [],
          },
        })),
      };

      // Save the statuses to a file with the username as part of the filename
      const outputFile = `${username}_statuses.json`;
      fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2), "utf8");

      console.log(
        `\nDone! Saved ${allStatuses.length} statuses to ${outputFile}`
      );
    }
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) {
      console.error("Response data:", err.response.data);
    }
  }
}

// Call the run function to start the process
run();
