const DB_NAME = "language_map";
const OBJECT_STORE_NAME = "geometries";

function getDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = e => {
      resolve(e.target.result);
    };
    request.onerror = e => {
      reject(e.target.errorCode);
    };
    request.onupgradeneeded = e => {
      const db = e.target.result;
      const objectStore = db.createObjectStore(OBJECT_STORE_NAME, {
        keyPath: "id"
      });
      objectStore.createIndex("id", "id", {
        unique: true
      });
    };
  });
}

function saveGeometries(db, geometries) {
  const transaction = db.transaction([OBJECT_STORE_NAME], "readwrite");
  const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
  const putPromises = geometries.map(geometry => {
    return new Promise((resolve, reject) => {
      const request = objectStore.put(geometry);
      request.onsuccess = e => resolve(e.target.result);
      request.onerror = e => reject(e.target.errorCode);
    });
  });
  return Promise.all(putPromises);
}

function loadAllGeometries(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OBJECT_STORE_NAME]);
    const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
    const request = objectStore.getAll();
    request.onsuccess = e => resolve(e.target.result);
    request.onerror = e => reject(e.target.errorCode);
  });
}

function resultsToCached(geometries) {
  return geometries.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

onmessage = e => {
  getDb().then(db => {
    if (e.data.msg === "loadAllGeometries") {
      loadAllGeometries(db).then(geometries => {
        postMessage(resultsToCached(geometries));
      });
    } else {
      saveGeometries(db, e.data.geometries);
    }
  });
};
