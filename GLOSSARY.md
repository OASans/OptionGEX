# OptionGEX Glossary

## What is GEX (Gamma Exposure)?

GEX measures the total gamma held by market makers across all option contracts for a given stock. When you buy an option, a market maker takes the other side. To stay neutral, they must **delta hedge** — buying or selling shares of the underlying stock as the price moves. Gamma tells us how much that hedging changes per $1 move in the stock.

GEX matters because market maker hedging creates real buying/selling pressure that can amplify or suppress stock price movement.

---

## Dashboard Metrics Explained

### Spot Price

The current trading price of the underlying stock. All GEX calculations are relative to this price.

### Net GEX

The total gamma exposure across all strikes, summing both calls and puts.

- **Positive Net GEX**: Market makers are long gamma. When the stock rises, they sell shares; when it falls, they buy shares. This creates a **dampening effect** — the stock tends to mean-revert and volatility is suppressed. Think of it as a rubber band pulling the price back.
- **Negative Net GEX**: Market makers are short gamma. When the stock rises, they must buy shares; when it falls, they must sell. This creates a **amplifying effect** — moves get bigger, volatility expands. The stock is more likely to make large, directional moves.

### Call GEX

Total gamma exposure from call options only. Calls contribute **positive** gamma — they create buying pressure on dips and selling pressure on rallies (stabilizing).

Formula per contract: `gamma * open_interest * 100 * spot_price^2 * 0.01`

### Put GEX

Total gamma exposure from put options only. Puts contribute **negative** gamma — they create selling pressure on dips and buying pressure on rallies (destabilizing).

Same formula, but the sign is flipped negative.

### Flip Point

The price level where cumulative net GEX crosses from negative to positive (or vice versa).

- **Above the flip point**: Net GEX is positive, market makers dampen moves. Expect lower volatility, range-bound trading.
- **Below the flip point**: Net GEX is negative, market makers amplify moves. Expect higher volatility, trending behavior.

The flip point often acts as a key support/resistance level. A stock trading near its flip point may be at an inflection — a break below could trigger an acceleration.

### Max Pain

The strike price at which the total dollar value of all outstanding options (both calls and puts) would expire worthless, causing maximum financial loss to option holders.

Calculation: for each possible expiry price, sum up how much all call and put holders would receive. The strike that **minimizes** this total payout is max pain.

Max pain matters because there's a theory that stocks tend to gravitate toward max pain near expiration, since market makers (who are net short options) benefit when options expire worthless. It's not a guaranteed magnet, but it provides a useful reference for where "gravitational pull" might exist.

### Max Gamma Strike

The strike price with the highest absolute net gamma exposure (|call GEX + put GEX|). This is where market maker hedging activity is most concentrated.

- If the stock is near the max gamma strike and net GEX is positive, expect strong **pinning** — the stock gets pulled toward this strike as market makers hedge aggressively in both directions.
- If net GEX is negative at this strike, expect the opposite — a potential **breakout** zone.

The max gamma strike often coincides with high open interest strikes and round numbers (e.g., $500, $550).

### Expirations

The option expiration dates included in the GEX calculation. By default, the nearest 4 expirations are used. Near-term expirations have the highest gamma (gamma increases as expiration approaches for at-the-money options), so they dominate the GEX profile.

### Updated

How long ago the data was last computed. The backend refreshes data every 30 seconds. If this shows "stale", the backend may be experiencing delays fetching option chain data.

---

## Chart Guide

### Bars

- **Green bars** (upward): Call GEX at each strike. Positive values = stabilizing force.
- **Red bars** (downward): Put GEX at each strike. Negative values = destabilizing force.
- The bars are stacked — the visible height of each bar shows the net effect at that strike.

### Reference Lines

- **Solid black line (Spot)**: Current stock price.
- **Dashed gold line (Flip)**: The flip point where net GEX changes sign.
- **Dashed purple line (MaxPain)**: The max pain strike.

### How to Read the Chart

1. **Look at where spot is relative to the flip point.** Above = calm, below = volatile.
2. **Look at the tallest bars.** These are the strikes with the most hedging activity — they act as magnets or walls.
3. **Compare max pain to spot.** If they're close, expect pinning near expiration. If far apart, the stock may drift toward max pain as expiration approaches.
4. **Watch for asymmetry.** If put GEX heavily outweighs call GEX, the downside is more volatile than the upside (and vice versa).

---

## Practical Use Cases

- **Selling premium**: Positive GEX environment (above flip) favors selling options — low volatility, range-bound.
- **Buying breakouts**: Negative GEX environment (below flip) favors directional trades — moves tend to follow through.
- **Expiration plays**: As expiration nears, gamma spikes. Max pain becomes more relevant. The GEX profile can shift rapidly.
- **Support/resistance**: High net GEX strikes act as support (positive) or resistance (negative). The max gamma strike is often a strong level.
