let tideLevel = 0;
let waterTemp = 0;
let currentField = []; // Store flow field data

let cols, rows;
let gridSize = 20; // Grid resolution for flow field

function setup() {
  createCanvas(600, 400);
  cols = width / gridSize;
  rows = height / gridSize;
  fetchOceanData();
}

function draw() {
    background(255);// Water temp affects color

  // Draw tide level as a wave
  let tideY = map(tideLevel, -2, 2, height - 50, 50);

  // Draw ocean current as a flow field
  drawFlowField();
}

function drawFlowField() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let { direction, speed, age } = currentField[y][x];

      let angle = radians(direction);
      let length = map(speed, 0, 2, 5, 20); // Normalize speed

      let startX = x * gridSize;
      let startY = y * gridSize;
      let endX = startX + cos(angle) * length;
      let endY = startY + sin(angle) * length;

      stroke(255, map(age, 0, 4, 255, 50)); // Older data = more faded
      line(startX, startY, endX, endY);
    }
  }
}

function fetchOceanData() {
  let stationID = "9410230"; // La Jolla for tides & temp
  let currentsStationID = "ca0101"; // cape cod
  const baseURL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

  let days = 5; // Fetch ocean currents for multiple days
  let promises = [];

  for (let i = 0; i < days; i++) {
    let day = new Array();
    let dates = ["2023-10-01", "2023-10-02", "2023-10-03", "2023-10-04", "2023-10-05"];
    let formattedDate = dates[i];

    let currentsURL = `${baseURL}?station=${currentsStationID}&product=currents&begin_date=${formattedDate}&end_date=${formattedDate}&units=metric&time_zone=gmt&format=json`;
    let tidesURL = `${baseURL}?station=${stationID}&product=water_level&begin_date=${formattedDate}&end_date=${formattedDate}&datum=MLLW&units=metric&time_zone=gmt&format=json`;
    let waterTempURL = `${baseURL}?station=${stationID}&product=water_temperature&begin_date=${formattedDate}&end_date=${formattedDate}&units=metric&time_zone=gmt&format=json`;
    let currentsPromise = fetch(currentsURL).then(res => res.json());
    let tidesPromise = fetch(tidesURL).then(res => res.json());
    let waterTempPromise = fetch(waterTempURL).then(res => res.json());

    promises.push(Promise.all([currentsPromise, tidesPromise, waterTempPromise]));
  }

  Promise.all(promises)
    .then((responses) => {
      let tidesData = responses[days]; // Last two responses are tides & temp
      let tempData = responses[days + 1];

      console.log("Tide Data:", tidesData);
      console.log("Water Temp Data:", tempData);

      tideLevel = tidesData.data ? parseFloat(tidesData.data[0].v) || 0 : 0;
      waterTemp = tempData.data ? parseFloat(tempData.data[0].v) || 0 : 0;

      // Extract ocean current data and generate the flow field
      currentField = Array(rows).fill().map(() => Array(cols).fill({ direction: 0, speed: 0 }));

      responses.slice(0, days).forEach((dayData, dayIndex) => {
        if (dayData.data && dayData.data.length > 0) {
          let latestEntry = dayData.data[0]; // Get first available entry

          let direction = parseFloat(latestEntry.d) || 0;
          let speed = parseFloat(latestEntry.s) || 0;

          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              currentField[y][x] = { direction, speed, age: dayIndex };
            }
          }
        }
      });

      console.log("Flow Field Data:", currentField);
    })
    .catch(error => console.error("API Fetch Error:", error));
}