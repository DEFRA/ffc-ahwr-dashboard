export const updateDetailsHandlers = [
  {
    method: "GET",
    path: "/update-details",
    options: {
      auth: false,
      handler: async (_, h) => {
        return h.view("update-details");
      },
    },
  },
];
