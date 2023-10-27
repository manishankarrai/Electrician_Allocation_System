// in this assignment  ,  i use express and  handlebar .  in handlebar i use boostrap link so , check when internet in available
// not separating this code in MVC Structure because its very small . so all business logic and route are here 



const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const hbs = require("hbs");

let allSite;    // for all locations
let allElectrisian;   // for all electricians 


app.use(express.urlencoded());
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "views", "partials"));


app.use(express.static(path.join(__dirname, "public")));


// load time hi data upload ho jayega from json file
( async function () {
  const jsonPath = path.join(__dirname, "public", "rawSiteData.json");
  await fs.readFile(jsonPath, "utf8", (err, data) => {
    if (err) {
      console.log({ error: "Error reading the JSON file" });
    } else {
      try {
        const jsonData = JSON.parse(data);
        allSite = jsonData;
        
        
      } catch (err) {
        console.log({ error: "Error parsing JSON data" });
      }
    }
  });
})();
 // upload electrician data here 
(  async function () {
  const jsonPath = path.join(__dirname, "public", "electricianData.json");
  await fs.readFile(jsonPath, "utf8", (err, data) => {
    if (err) {
      console.log({ error: "Error reading the JSON file" });
    } else {
      try {
        const jsonData = JSON.parse(data);
        allElectrisian = jsonData;
       
      } catch (err) {
        console.log({ error: "Error parsing JSON data" });
      }
    }
  });
})();

// route start 


app.get("/", (req, res) => {
  res.render("index", { allSite });
});

// route for change date 
app.post("/change-date", (req, res) => {

  const { id, newDate } = req.body;
 if(newDate){
  
  const recordId = parseInt(id);
  allSite[recordId].InstallationDate = newDate;
 }

  res.redirect("/");
});

//route for assign electrician to particular location 



app.get("/assign", async (req, res) => {


  // spearate variable and read name 
  // business logic goes here 
  let pendingLocation = false;
  let grieStatus = true;
  let simpleStatus = true;
  let grievanceLocation = [];
  let simpleLocation = [];
  let grievanceElectricianArr = [];
  let simpleElectricianArr = [];  

 // separate electrician based on grievance and simple
  for (let electrician of allElectrisian) {
    if (electrician.grievanceElectrician === true) {
      electrician.totalAssigned = 0;
      grievanceElectricianArr.push(electrician);
    } else {
      electrician.totalAssigned = 0;
      simpleElectricianArr.push(electrician);
    }
  }
// separate location based on grievance and simple
  for (let site of allSite) {
    if (site.grievance === true) {
      grievanceLocation.push(site);
    } else {
      simpleLocation.push(site);
    }
  }

  //function for  grievance location assignment
  function assignGravi(location, again) {
  
    if (location.AssignedElectritian.length > 0) {
      return;
    }
    let level = 0;
    let min = 0;
    let max = 0;
    grievanceElectricianArr.length > 0
      ? (min = grievanceElectricianArr[0].totalAssigned)
      : (min = 0);
    max = min;
    for (let i = 0; i < grievanceElectricianArr.length; i++) {
      if (min > grievanceElectricianArr[i].totalAssigned) {
        min = grievanceElectricianArr[i].totalAssigned;
      } else {
        max <= grievanceElectricianArr[i].totalAssigned
          ? (max = grievanceElectricianArr[i].totalAssigned)
          : "";
      }
    }
    level = min;

    
    if (level < 3) {
      for (let i = 0; i < grievanceElectricianArr.length; i++) {
        if (grievanceElectricianArr[i].totalAssigned === level) {
          grievanceElectricianArr[i].totalAssigned =
            grievanceElectricianArr[i].totalAssigned + 1;
          location.AssignedElectritian.push(grievanceElectricianArr[i]);

       
          return;
        }
      }
    } else {
      if (simpleStatus && again) {
        grieStatus = false;
        location.pending = false;
        assignSimple(location);
        pendingLocation = false;
      } else {
        location.pending = true;
        pendingLocation = true;
      }
    }
  }

  // function for simple location assignment
  function assignSimple(location, again = false) {
    if (location.AssignedElectritian.length > 0) {
      return;
    }
    
    let level = 0;
    let min = 0;
    let max = 0;
    simpleElectricianArr.length > 0
      ? (min = simpleElectricianArr[0].totalAssigned)
      : (min = 0);
    max = min;
    for (let i = 0; i < simpleElectricianArr.length; i++) {
      if (min > simpleElectricianArr[i].totalAssigned) {
        min = simpleElectricianArr[i].totalAssigned;
      } else {
        max <= simpleElectricianArr[i].totalAssigned
          ? (max = simpleElectricianArr[i].totalAssigned)
          : "";
      }
    }
    level = min;

   
    if (level < 3) {
      for (let i = 0; i < simpleElectricianArr.length; i++) {
        if (simpleElectricianArr[i].totalAssigned === level) {
          simpleElectricianArr[i].totalAssigned =
            simpleElectricianArr[i].totalAssigned + 1;
          location.AssignedElectritian.push(simpleElectricianArr[i]);


          return;
        }
      }
    } else {
      if (grieStatus && again) {
        simpleStatus = false;
        location.pending = false;
        assignGravi(location);
        pendingLocation = false;
      } else {
        location.pending = true;
        pendingLocation = true;
      }
    }
  }


  // start first loop for basic aasignment
  //for grievance 
  for (let location of grievanceLocation) {
    assignGravi(location);
  }
  // for simple 
  for (let location of simpleLocation) {
    assignSimple(location);
  }

  // then use function for  pending location and aassign electrician using recursive fun 
 async function end(){
      for (let location of grievanceLocation) {
      assignGravi(location, true);
    }
    for (let location of simpleLocation) {
      assignSimple(location, true);
    }
     let check1 = await simpleLocation.every(e =>  e.pending = false );
     let check2 = await grievanceLocation.every(e =>  e.pending = false );

    if(check1 || check2 ){
      end()
    }

  }

  end(); //call function here 


  res.redirect("/");
});




const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
