import * as otplib from "otplib";
console.log("KEYS:", Object.keys(otplib));
if (otplib.authenticator) {
  console.log("has authenticator");
} else if (otplib.default && otplib.default.authenticator) {
  console.log("has default.authenticator");
}
