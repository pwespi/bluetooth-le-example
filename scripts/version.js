const readJson = require("read-package-json");
const fs = require("fs");

// readJson(filename, [logFunction=noop], [strict=false], cb)
readJson("./package.json", console.error, false, (error, data) => {
  if (error) {
    console.error("There was an error reading the file", error);
    return;
  }

  // console.log('the package data is', data)
  const capacitorVersion = data?.devDependencies?.["@capacitor/core"];
  console.log(capacitorVersion);

  fs.writeFile(
    "./src/generated/version.json",
    JSON.stringify({ capacitorVersion }),
    error => {
      if (error) {
        console.error(error);
        return;
      }
      console.log("Version saved.");
    },
  );
});
