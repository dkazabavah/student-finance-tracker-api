# Student Finance Tracker

A simple, practical finance tracking web application that helps students record daily expenses, monitor spending behavior, and stay financially organized. The app works offline for local tracking and also uses a live external API to convert Rwandan Francs (RWF) into USD and EUR.

This version is designed to meet the assignment requirement for a meaningful application with external API integration, user interaction, clear data presentation, error handling, and deployment on two web servers plus a load balancer.

## Overview

The Student Finance Tracker allows users to:

- record daily expenses
- categorize spending
- edit and delete records
- search records using regex patterns
- filter and sort records
- export and import JSON data
- set a monthly spending cap
- switch to dark mode
- convert RWF values to USD and EUR using a live exchange rate API

All expense data and settings are saved locally in the browser using `localStorage`.

## Why this project is meaningful

Students often struggle to track small daily spending, especially transport, food, fees, and entertainment. This application helps users build financial awareness with a simple interface and practical tools. Instead of being a gimmick app, it solves a real everyday problem and adds value through data organization, search, statistics, and currency conversion.

## Main features

### Expense management
- Add, edit, and delete transactions
- Optional receipt image or receipt URL
- Automatic timestamps

### Categories
Default categories:
- Food
- Books
- Transport
- Entertainment
- Fees
- Other

Users can also add custom categories in Settings.

### Dashboard and statistics
- Total records
- Total spending
- Top category
- 7-day spending trend
- Monthly cap status
- Simple spending insights

### Search, filter, and sort
- Regex-powered live search
- Category filtering
- Multiple sort options
- Match highlighting in records

### Currency conversion API
- Base spending currency: RWF
- Converts amounts to USD and EUR
- Uses live exchange data from ExchangeRate-API
- API results are cached locally to reduce repeated requests

### Import / export
- Export expenses and settings to JSON
- Import JSON data with validation

### Offline storage
- Uses `localStorage`
- Records remain available even after refresh
- Works locally without a database

### Dark mode
- Optional dark mode toggle in Settings

## External API used

### ExchangeRate-API Open Access
Official docs: https://www.exchangerate-api.com/docs/free

This project uses the open access ExchangeRate-API endpoint:
`https://open.er-api.com/v6/latest/USD`

According to the official documentation, the open endpoint:
- requires no API key
- requires attribution
- updates once per day
- may return HTTP 429 if rate limits are exceeded
- allows caching of responses

The app includes attribution in the footer:
**Rates By Exchange Rate API**

## Setup guide

### 1. Clone the repository
```bash
git clone https://github.com/dkazabavah/student-finance-tracker-ui.git
```

### 2. Open the project folder
```bash
cd student-finance-tracker-ui
```

### 3. Run the app locally

#### Option A: VS Code Live Server
- Open the folder in VS Code
- Right-click `index.html`
- Choose **Open with Live Server**

#### Option B: Python HTTP server
```bash
python -m http.server 8000
```

Then open:
```text
http://localhost:8000
```

## Project structure

```text
student-finance-tracker-api/
│
├── index.html
├── tests.html
├── README.md
├── css/
│   └── main.css
├── scripts/
│   ├── app.js
│   ├── api.js
│   ├── search.js
│   ├── state.js
│   ├── storage.js
│   ├── ui.js
│   └── validators.js
└── data/
    └── seed.json
```

## Regex catalog

| Purpose | Pattern |
|---|---|
| Description format | `^\S(?:.*\S)?$` |
| Valid amount | `^(0|[1-9]\d*)(\.\d{1,2})?$` |
| Date format | `^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$` |
| Category format | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` |
| Duplicate word detection | `\b(\w+)\s+\1\b` |
| Cents search example | `\.\d{2}\b` |
| Beverage search example | `(coffee|tea)` |

## Accessibility notes

- Semantic HTML landmarks are used
- Labels are connected to inputs
- Visible focus indicators are included
- ARIA live regions announce updates
- Keyboard navigation is supported
- Color contrast is kept readable
- Skip link is included for accessibility

## Testing

Open:

```text
tests.html
```

This checks:
- regex validation
- duplicate word detection
- URL validation
- form rules

If all checks show ✓, the validation logic is working properly.

## Data storage

Expense data is saved in browser `localStorage`.

- Export: Records section → **Export JSON**
- Import: Records section → **Import JSON**

## Error handling

The application includes error handling for:
- invalid form inputs
- invalid import files
- broken or missing JSON structure
- exchange API failures
- fallback conversion when live data is unavailable
- empty search/filter results

## Deployment guide

This assignment requires deployment on:
- `web-01`
- `web-02`
- `lb-01`

### Deploy to web-01 and web-02

1. SSH into the server
2. Install Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

3. Copy the project files into the web root
```bash
sudo mkdir -p /var/www/student-finance-tracker
sudo cp -r * /var/www/student-finance-tracker/
```

4. Create an Nginx site config
```nginx
server {
    listen 80;
    server_name _;

    root /var/www/student-finance-tracker;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

5. Enable the site and restart Nginx
```bash
sudo ln -sf /etc/nginx/sites-available/student-finance-tracker /etc/nginx/sites-enabled/student-finance-tracker
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Configure the load balancer on lb-01

Example Nginx load balancer config:

```nginx
upstream student_tracker_backend {
    server WEB01_IP:80;
    server WEB02_IP:80;
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://student_tracker_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Then:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## How to test after deployment

- Open the load balancer IP in a browser
- Add and view records
- use search, filter, and conversion tools
- refresh several times to confirm the load balancer works
- temporarily customize content on each backend if you want to prove requests are being distributed

## Challenges encountered

Possible development and deployment challenges:
- making a static app still feel useful and practical
- integrating a real API while keeping the app simple
- handling API failure without breaking conversion features
- validating imported JSON safely
- configuring two web servers and a load balancer correctly

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- localStorage
- Nginx
- ExchangeRate-API

No frameworks used.

## Demo video plan

In under 2 minutes, show:

1. Home dashboard and statistics
2. Add an expense
3. Search and filter records
4. Export or import JSON
5. Currency conversion with live API
6. Deployed app through the load balancer

## Author

**David Kazabavaho**

- GitHub: https://github.com/dkazabavah
- Email: d.kazabavah@alustudent.com
- Demo video: https://drive.google.com/file/d/1ANUiNYifmuhVJHgJFOeY3tKpV9DN6BAs/view?usp=sharing
