// import express from "express";
// import path from "path";
// import cors from "cors";
const express = require('express')
const path = require('path')
const cors = require('cors')
const port = process.env.PORT || 8000;

try {
  express()
    .use(cors())
    .use(express.static(path.join(__dirname)))
    .listen(port);

  console.log(`> Read on http://localhost:${port}`);
} catch (e) {
  console.error((e as Error).stack);
  process.exit(1);
}
