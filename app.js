const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbpath = path.join(__dirname, "covid19India.db");

let db = null;

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: '${error.message}'`);
    process.exit(1);
  }
};

intializeDbAndServer();

const convertStateObjToResponseObj = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictObjToResponseObj = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// GET states

app.get("/states/", async (request, response) => {
  const stateQuery = `
    SELECT *
    FROM 
    state;`;

  const stateObj = await db.all(stateQuery);
  response.send(
    stateObj.map((eachState) => convertStateObjToResponseObj(eachState))
  );
});

// GET specific state

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const stateQuery = `
    SELECT *
    FROM 
    state
    WHERE 
    state_id='${stateId}';`;

  const stateObj = await db.get(stateQuery);
  response.send(convertStateObjToResponseObj(stateObj));
});

// ADD district

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addQuery = `
    INSERT INTO
    district(district_name,state_id,cases,cured,active,deaths)
    VALUES
       ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;

  const addDistrict = await db.run(addQuery);
  response.send("District Successfully Added");
});

// GET specific district

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const stateQuery = `
    SELECT *
    FROM 
    district
    WHERE 
    district_id=${districtId};`;

  const stateObj = await db.get(stateQuery);
  response.send(convertDistrictObjToResponseObj(stateObj));
});

// DELETE district

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const stateQuery = `
   DELETE FROM
   district
   WHERE 
   district_id=${districtId};`;

  const stateObj = await db.run(stateQuery);
  response.send("District Removed");
});

// UPDATE district

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateQuery = `
  UPDATE 
  district
  SET
   district_name='${districtName}',
   state_id=${stateId},
   cases=${cases},
   cured=${cured},
   active=${active},
   deaths=${deaths}
  WHERE
    district_id=${districtId};`;

  const districtObj = await db.run(updateQuery);
  response.send("District Details Updated");
});

// GET state stats

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const stateQuery = `
    SELECT SUM(cases) AS totalCases,SUM(cured) AS totalCured,SUM(active) AS totalActive,SUM(deaths) AS totalDeaths
    FROM 
    district INNER JOIN state 
    ON district.state_id=state.state_id
    WHERE 
    state.state_id=${stateId};`;

  const stateObj = await db.get(stateQuery);
  response.send(stateObj);
});

// GET district state

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const stateQuery = `
    SELECT (state_name) AS stateName
    FROM 
    district INNER JOIN state 
    ON district.state_id=state.state_id
    WHERE 
    district.district_id=${districtId}`;

  const stateObj = await db.get(stateQuery);
  response.send(stateObj);
});

module.exports = app;
