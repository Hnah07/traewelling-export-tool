# Traewelling Data Exporter

A Node.js script to fetch and export your statuses from Traewelling in the official export format. This tool allows you to download all your train journey statuses and save them in a format that can be imported back into Traewelling.

## Features

- Fetches all your statuses using pagination
- Exports data in Traewelling's official JSON format
- Includes detailed statistics about your journeys
- Handles API rate limiting with delays between requests
- Provides progress updates during the export process

## Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)
- A Traewelling account
- API token from Traewelling

## Installation

1. Clone this repository:

```bash
git clone https://github.com/Hnah07/traewelling-export-tool.git
cd traewelling-data-exporter
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root and add your Traewelling API token:

```env
API_TOKEN=your_api_token_here
```

To get your API token:

1. Log in to your Traewelling account
2. Go to your profile settings
3. Navigate to the API section
4. Generate a new API token

## Usage

Run the script using npm:

```bash
npm run fetch
```

The script will:

1. Fetch your user profile
2. Download all your statuses
3. Generate statistics about your journeys
4. Save the data to a JSON file named `{username}_statuses.json`

## Output

The script generates a JSON file containing:

- Meta information about your account
- Date range of your statuses
- Statistics about your journeys
- All your statuses in Traewelling's official format

The output file can be imported back into Traewelling using their import feature.

## Error Handling

The script includes error handling for:

- Missing API token
- Network errors
- Invalid API responses
- Rate limiting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This is an unofficial tool and is not affiliated with Traewelling. Use at your own risk.
