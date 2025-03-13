import boom from "@hapi/boom";
import { getBlob } from "../storage.js";
import { getEndemicsClaim } from "../session/index.js";

export const downloadApplicationHandlers = {
  method: "GET",
  path: "/download-application/{sbi}/{reference}",
  handler: async (request, h) => {
    const { sbi, reference } = request.params;
    request.logger.setBindings({ sbi, reference });
    const { LatestEndemicsApplicationReference, organisation } =
      getEndemicsClaim(request);
    const blobName = `${sbi}/${reference}.pdf`;
    if (
      LatestEndemicsApplicationReference === reference &&
      organisation.sbi === sbi
    ) {
      const blobBuffer = await getBlob(blobName);
      return h
        .response(blobBuffer)
        .type("application/pdf")
        .header("Content-type", "application/pdf")
        .header("Content-length", blobBuffer.length);
    }
    return boom.notFound();
  },
};
