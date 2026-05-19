db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || "sendio_logs");

db.createUser({
  user: process.env.MONGO_INITDB_ROOT_USERNAME || "root",
  pwd: process.env.MONGO_INITDB_ROOT_PASSWORD || "rootpassword",
  roles: [{ role: "readWrite", db: db.getName() }]
});
