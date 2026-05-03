import * as otplib from "otplib";
const authenticator = otplib.authenticator || otplib.default?.authenticator;
if (!authenticator) {
  console.error("authenticator NOT found!");
  process.exit(1);
} else {
  console.log("authenticator found successfully!");
  process.exit(0);
}
