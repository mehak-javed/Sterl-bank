import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SendMoneyShowcase } from "./SendMoneyShowcase";

describe("the landing page's send-money section", () => {
  const html = renderToStaticMarkup(<SendMoneyShowcase />);
  // Just the picture of the screen: from its role="img" to the feature cards list.
  const picture = html.slice(html.indexOf('role="img"'), html.indexOf("<ul"));

  it("describes the send-money screen in one sentence, with the amounts in pounds", () => {
    expect(html).toMatch(/aria-label="Sterl&#x27;s send money screen: sending £120\.00 from an Everyday Account with £1,250\.00 to [^"]+"/);
  });

  it("is only a picture: no real form, input or button that would look usable but do nothing", () => {
    expect(picture).not.toMatch(/<(form|input|button|select)\b/);
  });

  it("has the three feature cards", () => {
    for (const title of ["Analytics", "Budgeting", "Accounts"]) expect(html).toContain(`>${title}</h3>`);
  });

  it("uses the demo's own balances, formatted from pence", () => {
    for (const amount of ["£848.56", "£1,250.00", "£4,800.00", "+£0.53"]) expect(html).toContain(amount);
  });

  it("links to the real send-money form in the demo", () => {
    expect(html).toContain('href="/dashboard#move-money"');
  });
});
