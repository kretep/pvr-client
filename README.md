# Person Visit Registration client

A react web application for registering persons visits to an event.

Also see pvr-server and pvr-god.

## Run

```
npm start
```

## Backend
Relies on MongoDB + Restheart as a backend. It requires two collections to be available: "kinderen" and "bezoeken".

It currently has no authentication / authorization; it's intended to run on a local network.
