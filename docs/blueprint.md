# **App Name**: Thermal Vision

## Core Features:

- Serial Data Acquisition: Read serial data from a specified port at a defined baud rate (115200).
- Data Parsing: Parse the comma-separated values (CSV) from the serial data string into an array of temperature readings.
- Min/Max Temperature Tracking: Continuously monitor temperature data for new maximum and minimum values in order to optimize the rendering of colors.
- Thermal Image Generation: Map temperature values to a color gradient (blue to red) to visualize temperature distribution; present those colored 'pixels' on screen.
- Temperature Legend: Display a color-coded legend indicating the temperature range represented by the color gradient.
- Blur Filter: Apply a blur filter to the heatmap to smooth the transitions between pixels, reducing the blockiness and make thermal data appear clearer to a user.

## Style Guidelines:

- Primary color: Use a warm orange (#F26419) as the primary color to suggest heat and energy.
- Background color: A very dark gray (#1A1A1A) background provides high contrast for the heatmap.
- Accent color: A cool cyan (#33B8FF) to provide contrast and call attention to specific values and enhance readability in the UI.
- Font: 'Inter' (sans-serif) for both the body and legend, to ensure clarity and readability of displayed temperatures and UI elements.
- Display the heatmap in a prominent area of the UI. Reserve space for the temperature legend at the bottom.  Avoid clutter so the image remains the focal point.