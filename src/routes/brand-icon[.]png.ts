import { createFileRoute } from "@tanstack/react-router";
import { Buffer } from "node:buffer";

const ICON_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAALQAAAC0AgMAAABAo+6hAAAADFBMVEX///+bm5s3NzcKCgpfRkMWAAAC0ElEQVR42u2YP24TQRSHv7fZEAssMQUdSHFBH27gQUKiTcEBOAI3yHIDjkBJ6RKqTE4A9BShgiLFUETKkvE+CsfrnbHHDiAaNCO52JlPT795f0cW5TdWRaELXehCF7rQhS70/0GriCy+nopU0IqIyJ1ZhOtydcuvDhDVq8W5nOpqJfSpqs4jmocDOtHtgORd9i1/yxlwFW91Lqv7UFV9rISjrBJ/80v3NisJG+iLrfSM9b3N9PWNXxZrT1vLluiIqtLfck/1E+xlb6mpux9vzaqGLvqu87SAI4C9Le0JyC3z2+K5SOk6T1/g2d/s7DX6mICPtIYttg0BF9FfttIdDrPa+PkKJjkP1agO6Lks5GVsj+A0OgakydECp1FwgLu5rKo6eAxqh7Vzkqv5Si2GKqIPNF/zFp+Esm3yOWjX3MTbPG3W6e95egI8iLd+5un6xv6yLt+A5rpPpVfAtPfJns6BadYn+8TBqSycZ5UI0CRO8ttoSTJ+2EXTmrcJPdnWq2iiOoMRw5aR0mYt44ftaBcdXzsJM4e63kHc7edl5MKddDMMz07aDF24k54Mw7OTjly4kx79Fi3DDN9JRw6X8m/LX9LD/L6ebQzPi822/UZ7mlFicqGnxLLQ/5xux+24Hc8r2jHtmFYqfoz4KiMVmbyWlzFdE0Kowyoh9YkPQLtoPO8SJSGACf3QuHfufQdHjav0nA/XMS2BEIaz7oH3AMcOYF8TGj/FnE9WlRmaE7dWfUsl6k+88cerw/rMur76JLGtYjzuWU9f3BfjYGY7sVwnNNart+7ZUvnl5L4Yz+fGAjx/lCo5M86e1f095WNtPBzYSt1qTvW2z4xT7el7XWiN52gxoN5/T2mHmw5bTRhMvjtdQpu6Fj3Q6Yo+nIe1ptNnVV0TapRLaS6lAW8WtjuZQNMktkFCje3fC97I6mFiXelshS50oQtd6EIX+s/pX/YElzmaQvhPAAAAAElFTkSuQmCC";

export const Route = createFileRoute("/brand-icon.png")({
  server: {
    handlers: {
      GET: () => {
        const bytes = Buffer.from(ICON_BASE64, "base64");
        return new Response(bytes, {
          headers: {
            "content-type": "image/png",
            "content-length": String(bytes.byteLength),
            "cache-control": "public, max-age=300, must-revalidate",
          },
        });
      },
    },
  },
});
