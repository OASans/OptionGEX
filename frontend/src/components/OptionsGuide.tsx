import { useState } from "react";

const SECTIONS = [
  {
    title: "What Are Options?",
    content: [
      {
        term: "Call Option",
        desc: "A contract giving the buyer the right (not obligation) to buy 100 shares of a stock at a specific price (strike) before a specific date (expiration). You buy calls when you think the stock will go up.",
      },
      {
        term: "Put Option",
        desc: "A contract giving the buyer the right to sell 100 shares at the strike price before expiration. You buy puts when you think the stock will go down, or to hedge existing positions.",
      },
      {
        term: "Strike Price",
        desc: "The price at which the option holder can buy (call) or sell (put) the underlying stock. Options are listed at many different strikes.",
      },
      {
        term: "Expiration Date",
        desc: "The date the option contract expires. After this date, the option is worthless. Options lose value as expiration approaches (time decay).",
      },
      {
        term: "Premium",
        desc: "The price you pay to buy an option. It's made up of intrinsic value (how much it's in the money) and extrinsic value (time value + implied volatility).",
      },
      {
        term: "Open Interest (OI)",
        desc: "The total number of outstanding option contracts that haven't been closed or exercised. High OI at a strike indicates significant positioning by traders and market makers.",
      },
      {
        term: "In The Money (ITM)",
        desc: "A call is ITM when the stock price is above the strike. A put is ITM when the stock price is below the strike. ITM options have intrinsic value.",
      },
      {
        term: "Out of The Money (OTM)",
        desc: "A call is OTM when the stock price is below the strike. A put is OTM when the stock price is above the strike. OTM options have only extrinsic value.",
      },
      {
        term: "At The Money (ATM)",
        desc: "When the stock price is very close to the strike price. ATM options have the highest time value and the highest gamma.",
      },
    ],
  },
  {
    title: "The Greeks",
    content: [
      {
        term: "Delta",
        desc: "How much the option price changes per $1 move in the stock. Calls have delta 0 to 1, puts have -1 to 0. A delta of 0.50 means the option gains $0.50 for every $1 the stock rises. Also approximates the probability of expiring ITM.",
      },
      {
        term: "Gamma",
        desc: "How much delta changes per $1 move in the stock. It's the \"acceleration\" of the option. Highest for ATM options near expiration. This is the key Greek used in GEX calculations -- it determines how much market makers need to adjust their hedges.",
      },
      {
        term: "Theta",
        desc: "How much value the option loses per day from time decay (all else equal). Always negative for option buyers. Accelerates as expiration approaches, especially for ATM options. Theta is the cost of holding an option.",
      },
      {
        term: "Vega",
        desc: "How much the option price changes per 1% change in implied volatility. Higher for longer-dated options and ATM options. When IV rises (e.g., before earnings), all options become more expensive via vega.",
      },
      {
        term: "Rho",
        desc: "How much the option price changes per 1% change in interest rates. Generally the least important Greek for short-term trading. Calls gain value when rates rise, puts lose value.",
      },
    ],
  },
  {
    title: "Implied Volatility",
    content: [
      {
        term: "Implied Volatility (IV)",
        desc: "The market's forecast of the stock's future volatility, derived from option prices. High IV means expensive options (big expected move). Low IV means cheap options (small expected move). IV is annualized -- an IV of 30% means the market expects about a 30% move over one year.",
      },
      {
        term: "IV Crush",
        desc: "A sharp drop in implied volatility, typically after a known event (earnings, FDA decision). Even if the stock moves in your favor, the drop in IV can make your option lose value. Common trap for earnings plays.",
      },
      {
        term: "Volatility Skew",
        desc: "IV is not the same at every strike. Typically OTM puts have higher IV than OTM calls (the \"skew\"), reflecting higher demand for downside protection. The shape of the skew tells you about market sentiment.",
      },
    ],
  },
  {
    title: "Market Makers & GEX",
    content: [
      {
        term: "Market Maker",
        desc: "Institutions that provide liquidity by always offering to buy and sell options. They don't speculate on direction -- they profit from the bid-ask spread and hedge their exposure by trading the underlying stock.",
      },
      {
        term: "Delta Hedging",
        desc: "How market makers stay neutral. If they sell a call (positive delta), they buy shares to offset. As the stock moves, they continuously adjust their hedge. This hedging creates real buying/selling pressure in the stock.",
      },
      {
        term: "Gamma Exposure (GEX)",
        desc: "The total gamma across all options, weighted by open interest. Tells you how much hedging activity will happen per $1 move. Positive GEX = market makers dampen moves (buy dips, sell rallies). Negative GEX = market makers amplify moves.",
      },
      {
        term: "Positive Gamma Environment",
        desc: "When total GEX is positive (above the flip point), market makers are long gamma. They buy when prices fall and sell when prices rise, acting like a shock absorber. Expect lower volatility, mean reversion, and range-bound trading.",
      },
      {
        term: "Negative Gamma Environment",
        desc: "When total GEX is negative (below the flip point), market makers are short gamma. They must sell when prices fall and buy when prices rise, amplifying moves. Expect higher volatility, trending behavior, and potential for large moves.",
      },
      {
        term: "Pinning",
        desc: "Near expiration, stocks often \"pin\" to strikes with high open interest. Market maker hedging flows push the stock toward these strikes. The max gamma strike and max pain strike are common pinning targets.",
      },
    ],
  },
  {
    title: "Common Strategies",
    content: [
      {
        term: "Long Call / Long Put",
        desc: "Buying a call (bullish) or put (bearish). Limited risk (you can only lose the premium), unlimited upside for calls. Simple directional bets. Hurt by time decay and IV crush.",
      },
      {
        term: "Covered Call",
        desc: "Own 100 shares + sell a call against them. Generates income from the premium but caps your upside. Popular for income generation in sideways or slightly bullish markets.",
      },
      {
        term: "Vertical Spread",
        desc: "Buy one option and sell another at a different strike, same expiration. Bull call spread (buy lower call, sell higher call) or bear put spread (buy higher put, sell lower put). Reduces cost and risk vs. buying outright.",
      },
      {
        term: "Iron Condor",
        desc: "Sell an OTM call spread and an OTM put spread. Profits when the stock stays in a range. Best in high IV, positive GEX environments where you expect low volatility.",
      },
      {
        term: "Straddle / Strangle",
        desc: "Buy both a call and a put (straddle = same strike, strangle = different strikes). Profits from a big move in either direction. Best in low IV environments before expected catalysts.",
      },
    ],
  },
];

export function OptionsGuide() {
  const [openSection, setOpenSection] = useState<number>(0);

  return (
    <div className="guide">
      <div className="guide-header">
        <h2>Options Knowledge Base</h2>
        <p className="guide-subtitle">
          Essential concepts for understanding options and gamma exposure analysis
        </p>
      </div>
      <div className="guide-nav">
        {SECTIONS.map((s, i) => (
          <button
            key={i}
            className={`guide-nav-btn ${i === openSection ? "active" : ""}`}
            onClick={() => setOpenSection(i)}
          >
            {s.title}
          </button>
        ))}
      </div>
      <div className="guide-content">
        {SECTIONS[openSection].content.map((item, i) => (
          <div key={i} className="guide-item">
            <div className="guide-term">{item.term}</div>
            <div className="guide-desc">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
