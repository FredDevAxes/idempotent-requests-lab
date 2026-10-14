import { useRef } from "react";
import type { Exchange } from "./use-lab";

/** Decorative illustration of actual sends, never a network timing measurement. */
export function ExchangeMotion({ exchange }: { exchange?: Exchange }) {
  // Returning to a scenario or reloading must not replay an earlier exchange.
  const initialId = useRef(exchange?.id);
  if (!exchange || exchange.id === initialId.current) return null;
  const returnDelay = Math.max(
    0,
    850 - ((exchange.settledAt ?? exchange.startedAt) - exchange.startedAt),
  );
  return (
    <div
      className="exchange-motion"
      key={exchange.id}
      aria-hidden="true"
      data-exchange={exchange.id}
      data-result={exchange.outcome ?? "pending"}
    >
      <div className="packet-lane request-packets">
        {Array.from({ length: exchange.count > 1 ? 3 : 1 }, (_, index) => (
          <div
            className="packet-travel"
            key={index}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <i />
          </div>
        ))}
      </div>
      {exchange.outcome && (
        <div className={`packet-lane reply-packets ${exchange.outcome}`}>
          <div
            className="packet-travel"
            style={{ animationDelay: `${returnDelay}ms` }}
          >
            <i />
          </div>
        </div>
      )}
    </div>
  );
}
