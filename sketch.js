let tideLevels = [];  // Stores tide level for each day
let waterTemps = [];  // Stores water temperature for each day
let oceanCurrents = []; // Stores current speed & direction for each day
let resolution = 50; // Number of arrows to draw
let maxspeed = 5; // Maximum current speed

let offset = 0; // Offset for scrolling through days

function setup() {
  createCanvas(1920, 1080);
  fetchOceanData();
}

function draw() {
  background(0);
  offset = (offset + 1) % 5;
    // Visualize ocean current data
  drawOceanCurrents(offset);
}

function fetchOceanData() {
  let stationID = "9410230"; // La Jolla (for tides & temp)
  let currentsStationID = "ca0101"; // Cape Cod (currents)
  const baseURL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

  //let dates = ["2024-10-01", "2023-10-02", "2023-10-03", "2023-10-04", "2023-10-05"];
    let today = new Date();
    let dates = [];
    for (let i = 0; i < resolution; i++) {
        let date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
  let promises = dates.map(date => {
    let currentsURL = `${baseURL}?station=${currentsStationID}&product=currents&begin_date=${date}&end_date=${date}&units=metric&time_zone=gmt&format=json`;
    let tidesURL = `${baseURL}?station=${stationID}&product=water_level&begin_date=${date}&end_date=${date}&datum=MLLW&units=metric&time_zone=gmt&format=json`;
    let waterTempURL = `${baseURL}?station=${stationID}&product=water_temperature&begin_date=${date}&end_date=${date}&units=metric&time_zone=gmt&format=json`;

    return Promise.all([
      fetch(currentsURL).then(res => res.json()),
      fetch(tidesURL).then(res => res.json()),
      fetch(waterTempURL).then(res => res.json())
    ]);
  });

  Promise.all(promises)
    .then(responses => {
      responses.forEach(([currentsData, tidesData, tempData], index) => {
        let tideLevel = tidesData.data && tidesData.data.length ? parseFloat(tidesData.data[0].v) || 0 : 0;
        let waterTemp = tempData.data && tempData.data.length ? parseFloat(tempData.data[0].v) || 0 : 0;
        let currentSpeed = currentsData.data && currentsData.data.length ? parseFloat(currentsData.data[0].s) || 0 : 0;
        let currentDirection = currentsData.data && currentsData.data.length ? parseFloat(currentsData.data[0].d) || 0 : 0;

        tideLevels.push({ date: dates[index], level: tideLevel });
        waterTemps.push({ date: dates[index], temp: waterTemp });
        oceanCurrents.push({ date: dates[index], speed: currentSpeed, direction: currentDirection });
      });

      console.log("Tide Levels:", tideLevels);
      console.log("Water Temperatures:", waterTemps);
      console.log("Ocean Currents:", oceanCurrents);
    })
    .catch(error => console.error("API Fetch Error:", error));
}

function drawOceanCurrents(offset) {
    widthRatio = width / resolution;
    heightRatio = height / resolution;
    for(let i = 0; i < oceanCurrents.length; i++) {
        for (let j = 0; j < resolution; j++) {
            let angle = radians(oceanCurrents[i].direction);
            let length = oceanCurrents[i].speed/maxspeed; // Normalize speed

            let x = j*widthRatio + widthRatio/2; // Space out arrows
            let y = i*heightRatio+ heightRatio/2; // Space out rows
            let endX = x + cos(angle) * length;
            let endY = y + sin(angle) * length;

            stroke(waterTemps[i].temp, 255, 255, (tideLevels[i].level+0.5)*255);
            line(x, y, endX, endY);
            fill(255);
        }
    };
}