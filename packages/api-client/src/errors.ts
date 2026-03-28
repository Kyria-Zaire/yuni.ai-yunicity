import type { ProblemDetail } from "./types";

export class YuniAPIError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`Yuni API error ${status}`);
    this.name = "YuniAPIError";
    this.status = status;
    this.body = body;
  }

  get problem(): ProblemDetail | undefined {
    if (
      this.body &&
      typeof this.body === "object" &&
      "title" in this.body &&
      "status" in this.body
    ) {
      return this.body as ProblemDetail;
    }
    return undefined;
  }
}
