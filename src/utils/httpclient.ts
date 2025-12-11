import ky from "ky";

var httpClient = ky.create({
  timeout: 10000,
  retry: {
    limit: 2,
    methods: ["get", "put", "head", "delete", "options", "trace"],
  },
});

export default httpClient;
