# Hand-me-down for Google Meet

Automatically lower your hand in Google Meet when you start talking

## Install

	$ npm install

## Development

    npm run dev chrome
    npm run dev firefox
    npm run dev opera
    npm run dev edge

## Build

    # Generate packages for all browser in one command:
    npm run build-all
    
    # Or, package them up one by one:
    npm run build chrome
    npm run build firefox
    npm run build opera
    npm run build edge

## Environment

The build tool also defines a variable named `process.env.NODE_ENV` in your scripts.
