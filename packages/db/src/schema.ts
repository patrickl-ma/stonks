import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => ({
    issuerAccountIdUnique: uniqueIndex("account_issuer_account_id_unique").on(
      table.issuer,
      table.accountId,
    ),
  }),
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const authSchema = { user, session, account, verification };
  
export const ca_event_base= {
  description:
    'Common fields present on every `ca` payload regardless of `event_type`.\nNot meant to be referenced directly by clients -- it exists so each\nper-type payload schema (`ca_event_cash_dividend`, `ca_event_forward_split`,\n...) can `allOf`-compose it instead of restating `id` and `process_date`.\nThis makes the "always present" invariant structural (guaranteed by the\nschema) rather than emergent from repetition, and matches the "Common `ca`\nfields" section of the event-streaming Corporate Actions SSE design doc.\n',
  properties: {
    id: { $ref: "#/components/schemas/ca_id" },
    process_date: { $ref: "#/components/schemas/process_date" },
  },
  required: ["id", "process_date"],
  type: "object",
};

export const ca_event_cash_dividend= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        currency: { $ref: "#/components/schemas/currency" },
        cusip: {
          description: "CUSIP of the security.",
          type: "string",
        },
        due_bill_off_date: {
          description: "End of the due-bill period.",
          format: "date",
          type: "string",
        },
        due_bill_on_date: {
          description: "Start of the due-bill period.",
          format: "date",
          type: "string",
        },
        ex_date: { $ref: "#/components/schemas/ex_date" },
        foreign: {
          description: "`true` if the issuer is not US-based.",
          type: "boolean",
        },
        isin: { $ref: "#/components/schemas/isin" },
        payable_date: { $ref: "#/components/schemas/payable_date" },
        rate: {
          description: "Cash paid per share, as a decimal string.",
          examples: ["0.24"],
          type: "string",
        },
        record_date: { $ref: "#/components/schemas/record_date" },
        special: {
          description:
            "`true` if this is a one-off dividend outside the issuer's regular\ndistribution schedule.\n",
          type: "boolean",
        },
        sub_type: {
          description: "Optional sub-classification of the dividend.",
          enum: ["interest", "return_of_capital"],
          type: "string",
        },
        symbol: {
          description: "Ticker paying the dividend.",
          type: "string",
        },
      },
      required: ["symbol", "cusip", "rate", "special", "foreign", "ex_date"],
      type: "object",
    },
  ],
  description:
    "Cash dividend payload delivered when\n`event_type == cash_dividend_corporateaction_event`. Corresponds to\n`cash_dividends` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_cash_merger= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        acquiree_cusip: {
          description: "CUSIP of the company being bought.",
          type: "string",
        },
        acquiree_isin: { $ref: "#/components/schemas/isin" },
        acquiree_symbol: {
          description:
            "Ticker being bought (will disappear after the merger).",
          type: "string",
        },
        acquirer_cusip: {
          description: "Buyer's CUSIP.",
          type: "string",
        },
        acquirer_isin: { $ref: "#/components/schemas/isin" },
        acquirer_symbol: {
          description: "Buyer's ticker (the surviving company).",
          type: "string",
        },
        currency: { $ref: "#/components/schemas/currency" },
        effective_date: {
          $ref: "#/components/schemas/effective_date",
        },
        payable_date: { $ref: "#/components/schemas/payable_date" },
        rate: {
          description:
            "Cash paid per share of the acquired company, as a decimal string.",
          examples: ["42.50"],
          type: "string",
        },
      },
      required: [
        "acquiree_symbol",
        "acquiree_cusip",
        "rate",
        "effective_date",
      ],
      type: "object",
    },
  ],
  description:
    "Cash merger payload delivered when\n`event_type == cash_merger_corporateaction_event`. Corresponds to\n`cash_mergers` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_equity_partial_call= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        currency: { $ref: "#/components/schemas/currency" },
        cusip: {
          description: "CUSIP of the security.",
          type: "string",
        },
        dividend_rate: {
          description:
            "Dividend rate associated with the called shares, as a decimal string.",
          examples: ["0.05"],
          type: "string",
        },
        isin: { $ref: "#/components/schemas/isin" },
        lottery_date: {
          description: "When the lottery drawing happens.",
          format: "date",
          type: "string",
        },
        lottery_type: {
          description: "How called shares were allocated among holders.",
          enum: ["original", "supplemental"],
          type: "string",
        },
        payable_date: { $ref: "#/components/schemas/payable_date" },
        price: {
          description: "Price paid per called share, as a decimal string.",
          examples: ["15.00"],
          type: "string",
        },
        record_date: { $ref: "#/components/schemas/record_date" },
        results_publication_date: {
          description: "When the lottery results are published.",
          format: "date",
          type: "string",
        },
        symbol: {
          description: "Ticker being partially called.",
          type: "string",
        },
      },
      required: ["symbol"],
      type: "object",
    },
  ],
  description:
    "Partial redemption of an equity issue where the issuer calls back only a\nfraction of outstanding shares -- typically allocated to holders via a\nlottery. Delivered when\n`event_type == equity_partial_call_corporateaction_event`. Corresponds to\n`partial_calls` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_forward_split= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        currency: { $ref: "#/components/schemas/currency" },
        cusip: {
          description: "CUSIP of the security.",
          type: "string",
        },
        due_bill_redemption_date: {
          $ref: "#/components/schemas/due_bill_redemption_date",
        },
        ex_date: { $ref: "#/components/schemas/ex_date" },
        isin: { $ref: "#/components/schemas/isin" },
        new_rate: {
          description: "Shares after the split, as a decimal string.",
          examples: ["4"],
          type: "string",
        },
        old_rate: {
          description: "Shares before the split, as a decimal string.",
          examples: ["1"],
          type: "string",
        },
        payable_date: { $ref: "#/components/schemas/payable_date" },
        record_date: { $ref: "#/components/schemas/record_date" },
        symbol: {
          description: "Ticker being split.",
          type: "string",
        },
      },
      required: ["symbol", "cusip", "old_rate", "new_rate", "ex_date"],
      type: "object",
    },
  ],
  description:
    "Forward stock split payload delivered when\n`event_type == forward_split_corporateaction_event`. Corresponds to\n`forward_splits` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_name_change= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        currency: { $ref: "#/components/schemas/currency" },
        new_cusip: {
          description: "CUSIP after the change.",
          type: "string",
        },
        new_isin: { $ref: "#/components/schemas/isin" },
        new_symbol: {
          description: "Ticker after the change.",
          type: "string",
        },
        old_cusip: {
          description: "CUSIP before the change.",
          type: "string",
        },
        old_isin: { $ref: "#/components/schemas/isin" },
        old_symbol: {
          description: "Ticker before the change.",
          type: "string",
        },
      },
      required: ["old_symbol", "old_cusip", "new_symbol", "new_cusip"],
      type: "object",
    },
  ],
  description:
    "Name/ticker change payload delivered when\n`event_type == name_change_corporateaction_event`. Corresponds to\n`name_changes` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response.\n",
};

export const ca_event_redemption= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        currency: { $ref: "#/components/schemas/currency" },
        cusip: {
          description: "CUSIP of the security.",
          type: "string",
        },
        isin: { $ref: "#/components/schemas/isin" },
        payable_date: { $ref: "#/components/schemas/payable_date" },
        rate: {
          description: "Cash paid per share, as a decimal string.",
          examples: ["25.00"],
          type: "string",
        },
        symbol: {
          description: "Ticker being redeemed.",
          type: "string",
        },
      },
      required: ["symbol", "cusip", "rate"],
      type: "object",
    },
  ],
  description:
    "Full redemption payload delivered when\n`event_type == redemption_corporateaction_event`. Corresponds to\n`redemptions` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_reorganization= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        cash_rate: {
          description: "Cash paid per source share, as a decimal string.",
          examples: ["5.00"],
          type: "string",
        },
        currency: { $ref: "#/components/schemas/currency" },
        cusip: {
          description: "CUSIP of the original security.",
          type: "string",
        },
        effective_date: {
          $ref: "#/components/schemas/effective_date",
        },
        isin: { $ref: "#/components/schemas/isin" },
        payable_date: { $ref: "#/components/schemas/payable_date" },
        stock_movements: {
          description:
            "One entry per replacement security delivered to holders.",
          items: {
            $ref: "#/components/schemas/ca_event_reorganization_stock_movement",
          },
          type: "array",
        },
        symbol: {
          description: "Ticker undergoing the reorganization.",
          type: "string",
        },
      },
      required: ["symbol", "cusip", "effective_date"],
      type: "object",
    },
  ],
  description:
    "General-purpose corporate restructuring (e.g. Chapter 11 emergence) where\nexisting holders receive a mix of cash and/or one or more replacement\nsecurities. Each entry in `stock_movements` describes a separate\nshare-class distribution. Delivered when\n`event_type == reorganization_corporateaction_event`. Corresponds to\n`reorganizations` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_reorganization_stock_movement= {
  additionalProperties: false,
  description:
    "A single replacement-security leg of a\n[`ca_event_reorganization`](#/components/schemas/ca_event_reorganization)\npayload. All decimal fields are emitted as JSON strings to preserve\nprecision on the wire.\n",
  properties: {
    cusip: { description: "Replacement CUSIP.", type: "string" },
    isin: { $ref: "#/components/schemas/isin" },
    new_rate: {
      description:
        "Replacement shares delivered per `source_rate`, as a decimal string.",
      examples: ["1"],
      type: "string",
    },
    source_rate: {
      description:
        "Source shares required for each `new_rate`, as a decimal string.",
      examples: ["10"],
      type: "string",
    },
    symbol: { description: "Replacement ticker.", type: "string" },
  },
  required: ["symbol", "cusip", "new_rate", "source_rate"],
  type: "object",
};

export const ca_event_reverse_split= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        currency: { $ref: "#/components/schemas/currency" },
        ex_date: { $ref: "#/components/schemas/ex_date" },
        new_cusip: {
          description: "CUSIP after the split.",
          type: "string",
        },
        new_isin: { $ref: "#/components/schemas/isin" },
        new_rate: {
          description: "Shares after the split, as a decimal string.",
          examples: ["1"],
          type: "string",
        },
        new_symbol: {
          description:
            'Ticker after the split when the issuer also changes symbol (e.g. with\na "D" suffix). Omitted when the ticker doesn\'t change.\n',
          type: "string",
        },
        old_cusip: {
          description: "CUSIP before the split.",
          type: "string",
        },
        old_isin: { $ref: "#/components/schemas/isin" },
        old_rate: {
          description: "Shares before the split, as a decimal string.",
          examples: ["10"],
          type: "string",
        },
        payable_date: { $ref: "#/components/schemas/payable_date" },
        record_date: { $ref: "#/components/schemas/record_date" },
        symbol: {
          description: "Ticker being split.",
          type: "string",
        },
      },
      required: [
        "symbol",
        "old_cusip",
        "new_cusip",
        "old_rate",
        "new_rate",
        "ex_date",
      ],
      type: "object",
    },
  ],
  description:
    "Reverse stock split payload delivered when\n`event_type == reverse_split_corporateaction_event`. Corresponds to\n`reverse_splits` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_rights_distribution= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        currency: { $ref: "#/components/schemas/currency" },
        ex_date: { $ref: "#/components/schemas/ex_date" },
        expiration_date: {
          $ref: "#/components/schemas/expiration_date",
        },
        new_cusip: {
          description: "CUSIP of the new right.",
          type: "string",
        },
        new_isin: { $ref: "#/components/schemas/isin" },
        new_symbol: {
          description: "Ticker of the new right/warrant.",
          type: "string",
        },
        payable_date: { $ref: "#/components/schemas/payable_date" },
        rate: {
          description: "Rights given per share you own, as a decimal string.",
          examples: ["0.25"],
          type: "string",
        },
        record_date: { $ref: "#/components/schemas/record_date" },
        source_cusip: {
          description: "CUSIP of the underlying ticker.",
          type: "string",
        },
        source_isin: { $ref: "#/components/schemas/isin" },
        source_symbol: {
          description: "Ticker whose holders receive the rights.",
          type: "string",
        },
      },
      required: [
        "source_symbol",
        "source_cusip",
        "new_symbol",
        "new_cusip",
        "rate",
        "ex_date",
        "payable_date",
      ],
      type: "object",
    },
  ],
  description:
    "Rights distribution payload delivered when\n`event_type == rights_distribution_corporateaction_event`. Corresponds to\n`rights_distributions` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_spin_off= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        currency: { $ref: "#/components/schemas/currency" },
        due_bill_redemption_date: {
          $ref: "#/components/schemas/due_bill_redemption_date",
        },
        ex_date: { $ref: "#/components/schemas/ex_date" },
        new_cusip: {
          description: "CUSIP of the new spin-off company.",
          type: "string",
        },
        new_isin: { $ref: "#/components/schemas/isin" },
        new_rate: {
          description:
            "New-company shares distributed per `source_rate` parent shares, as a decimal string.",
          examples: ["0.5"],
          type: "string",
        },
        new_symbol: {
          description: "Ticker of the new spin-off company.",
          type: "string",
        },
        payable_date: { $ref: "#/components/schemas/payable_date" },
        record_date: { $ref: "#/components/schemas/record_date" },
        source_cusip: {
          description: "Parent CUSIP.",
          type: "string",
        },
        source_isin: { $ref: "#/components/schemas/isin" },
        source_rate: {
          description:
            "Parent shares required per ratio unit, as a decimal string.",
          examples: ["1"],
          type: "string",
        },
        source_symbol: {
          description: "Parent company's ticker.",
          type: "string",
        },
      },
      required: [
        "source_symbol",
        "source_cusip",
        "source_rate",
        "new_symbol",
        "new_cusip",
        "new_rate",
        "ex_date",
      ],
      type: "object",
    },
  ],
  description:
    "Spin-off payload delivered when\n`event_type == spin_off_corporateaction_event`. Corresponds to\n`spin_offs` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_stock_and_cash_merger= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        acquiree_cusip: {
          description: "CUSIP of the company being bought.",
          type: "string",
        },
        acquiree_isin: { $ref: "#/components/schemas/isin" },
        acquiree_rate: {
          description: "Bought-side ratio, as a decimal string.",
          examples: ["1"],
          type: "string",
        },
        acquiree_symbol: {
          description: "Ticker being bought (will disappear).",
          type: "string",
        },
        acquirer_cusip: {
          description: "Buyer's CUSIP.",
          type: "string",
        },
        acquirer_isin: { $ref: "#/components/schemas/isin" },
        acquirer_rate: {
          description:
            "Buyer shares given per unit ratio, as a decimal string.",
          examples: ["0.5"],
          type: "string",
        },
        acquirer_symbol: {
          description: "Buyer's ticker (the surviving company).",
          type: "string",
        },
        cash_rate: {
          description:
            "Extra cash paid per share of the acquired company, as a decimal string.",
          examples: ["10.00"],
          type: "string",
        },
        currency: { $ref: "#/components/schemas/currency" },
        effective_date: {
          $ref: "#/components/schemas/effective_date",
        },
        payable_date: { $ref: "#/components/schemas/payable_date" },
      },
      required: [
        "acquirer_symbol",
        "acquirer_cusip",
        "acquirer_rate",
        "acquiree_symbol",
        "acquiree_cusip",
        "acquiree_rate",
        "cash_rate",
        "effective_date",
      ],
      type: "object",
    },
  ],
  description:
    "Merger paying a mix of stock and cash. Delivered when\n`event_type == stock_and_cash_merger_corporateaction_event`. Corresponds\nto `stock_and_cash_mergers` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_stock_dividend= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        currency: { $ref: "#/components/schemas/currency" },
        cusip: {
          description: "CUSIP of the security.",
          type: "string",
        },
        ex_date: { $ref: "#/components/schemas/ex_date" },
        isin: { $ref: "#/components/schemas/isin" },
        payable_date: { $ref: "#/components/schemas/payable_date" },
        rate: {
          description:
            "Extra shares received per share held, as a decimal string.",
          examples: ["0.05"],
          type: "string",
        },
        record_date: { $ref: "#/components/schemas/record_date" },
        symbol: {
          description: "Ticker paying the stock dividend.",
          type: "string",
        },
      },
      required: ["symbol", "cusip", "rate", "ex_date"],
      type: "object",
    },
  ],
  description:
    "Stock dividend payload delivered when\n`event_type == stock_dividend_corporateaction_event`. Corresponds to\n`stock_dividends` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_stock_merger= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        acquiree_cusip: {
          description: "CUSIP of the company being bought.",
          type: "string",
        },
        acquiree_isin: { $ref: "#/components/schemas/isin" },
        acquiree_rate: {
          description: "Bought-side ratio, as a decimal string.",
          examples: ["1"],
          type: "string",
        },
        acquiree_symbol: {
          description: "Ticker being bought (will disappear).",
          type: "string",
        },
        acquirer_cusip: {
          description: "Buyer's CUSIP.",
          type: "string",
        },
        acquirer_isin: { $ref: "#/components/schemas/isin" },
        acquirer_rate: {
          description: "Buyer-side ratio, as a decimal string.",
          examples: ["0.75"],
          type: "string",
        },
        acquirer_symbol: {
          description: "Buyer's ticker (the surviving company).",
          type: "string",
        },
        currency: { $ref: "#/components/schemas/currency" },
        effective_date: {
          $ref: "#/components/schemas/effective_date",
        },
        payable_date: { $ref: "#/components/schemas/payable_date" },
      },
      required: [
        "acquirer_symbol",
        "acquirer_cusip",
        "acquirer_rate",
        "acquiree_symbol",
        "acquiree_cusip",
        "acquiree_rate",
        "effective_date",
      ],
      type: "object",
    },
  ],
  description:
    "All-stock merger payload delivered when\n`event_type == stock_merger_corporateaction_event`. Corresponds to\n`stock_mergers` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_unit_split= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        alternate_cusip: {
          description: "CUSIP of the secondary leg.",
          type: "string",
        },
        alternate_isin: { $ref: "#/components/schemas/isin" },
        alternate_rate: {
          description:
            "Secondary-leg shares delivered per unit, as a decimal string.",
          examples: ["1"],
          type: "string",
        },
        alternate_symbol: {
          description: "Ticker of the secondary leg (usually a warrant).",
          type: "string",
        },
        currency: { $ref: "#/components/schemas/currency" },
        effective_date: {
          $ref: "#/components/schemas/effective_date",
        },
        new_cusip: {
          description: "CUSIP of the primary leg.",
          type: "string",
        },
        new_isin: { $ref: "#/components/schemas/isin" },
        new_rate: {
          description:
            "Primary-leg shares delivered per unit, as a decimal string.",
          examples: ["1"],
          type: "string",
        },
        new_symbol: {
          description:
            "Ticker of the primary leg (usually the common share).",
          type: "string",
        },
        old_cusip: {
          description: "CUSIP of the unit.",
          type: "string",
        },
        old_isin: { $ref: "#/components/schemas/isin" },
        old_rate: {
          description: "Units per ratio unit, as a decimal string.",
          examples: ["1"],
          type: "string",
        },
        old_symbol: {
          description: "Ticker of the unit being split.",
          type: "string",
        },
        payable_date: { $ref: "#/components/schemas/payable_date" },
      },
      required: [
        "old_symbol",
        "old_cusip",
        "old_rate",
        "new_symbol",
        "new_cusip",
        "new_rate",
        "alternate_symbol",
        "alternate_cusip",
        "alternate_rate",
        "effective_date",
      ],
      type: "object",
    },
  ],
  description:
    "Unit split payload delivered when\n`event_type == unit_split_corporateaction_event`. Corresponds to\n`unit_splits` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response, but\nevery decimal field is emitted as a JSON string to preserve precision on\nthe wire.\n",
};

export const ca_event_worthless_removal= {
  allOf: [
    { $ref: "#/components/schemas/ca_event_base" },
    {
      properties: {
        currency: { $ref: "#/components/schemas/currency" },
        cusip: {
          description: "CUSIP of the security.",
          type: "string",
        },
        isin: { $ref: "#/components/schemas/isin" },
        symbol: {
          description: "Ticker being removed.",
          type: "string",
        },
      },
      required: ["symbol", "cusip"],
      type: "object",
    },
  ],
  description:
    "Worthless removal payload delivered when\n`event_type == worthless_removal_corporateaction_event`. Corresponds to\n`worthless_removals` on the REST\n[`GET /v1/corporate-actions`](#operation/CorporateActions) response.\n",
};

export const ca_id= {
  description: "The internal Alpaca identifier of the corporate action.",
  format: "uuid",
  type: "string",
};

export const cash_dividend= {
  description: "Cash dividend.",
  examples: [
    {
      cusip: "319829107",
      ex_date: "2023-05-04",
      foreign: false,
      id: "11cfd108-292e-4cc6-bfbf-5999cdbc4029",
      payable_date: "2023-05-19",
      process_date: "2023-05-19",
      rate: 0.125,
      record_date: "2023-05-05",
      special: false,
      symbol: "FCF",
    },
  ],
  properties: {
    currency: { $ref: "#/components/schemas/currency" },
    cusip: { type: "string" },
    due_bill_off_date: { format: "date", type: "string" },
    due_bill_on_date: { format: "date", type: "string" },
    ex_date: { $ref: "#/components/schemas/ex_date" },
    foreign: { type: "boolean" },
    id: { $ref: "#/components/schemas/ca_id" },
    isin: { $ref: "#/components/schemas/isin" },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    process_date: { $ref: "#/components/schemas/process_date" },
    rate: { format: "double", type: "number" },
    record_date: { $ref: "#/components/schemas/record_date" },
    special: { type: "boolean" },
    sub_type: {
      description: "Sub-type of the cash dividend.",
      enum: ["interest", "return_of_capital"],
      type: "string",
    },
    symbol: { type: "string" },
  },
  required: [
    "id",
    "symbol",
    "cusip",
    "rate",
    "special",
    "foreign",
    "process_date",
    "ex_date",
  ],
  type: "object",
};

export const cash_merger= {
  description: "Cash merger.",
  examples: [
    {
      acquiree_cusip: "Y2687W108",
      acquiree_symbol: "GLOP",
      effective_date: "2023-07-17",
      id: "3772bbd7-4ad5-44d4-9cc0-f69156a2f8f5",
      payable_date: "2023-07-17",
      process_date: "2023-07-17",
      rate: 5.37,
    },
  ],
  properties: {
    acquiree_cusip: { type: "string" },
    acquiree_isin: { $ref: "#/components/schemas/isin" },
    acquiree_symbol: { type: "string" },
    acquirer_cusip: { type: "string" },
    acquirer_isin: { $ref: "#/components/schemas/isin" },
    acquirer_symbol: { type: "string" },
    currency: { $ref: "#/components/schemas/currency" },
    effective_date: { $ref: "#/components/schemas/effective_date" },
    id: { $ref: "#/components/schemas/ca_id" },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    process_date: { $ref: "#/components/schemas/process_date" },
    rate: { format: "double", type: "number" },
  },
  required: [
    "id",
    "acquiree_symbol",
    "acquiree_cusip",
    "rate",
    "process_date",
    "effective_date",
  ],
  type: "object",
};

export const corporate_action_event= {
  description:
    "A single corporate-action mutation delivered over the\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n\nEvery event uses the same envelope. The `event_type` field selects which of\nthe 15 per-type schemas populates `ca`; see\n[`corporate_action_event_type`](#/components/schemas/corporate_action_event_type)\nfor the full mapping and follow the link on each row to the per-type `ca`\npayload schema.\n\nOptional fields (including `currency` and, on most CA types, `isin`) are\nomitted from the JSON when empty; `null` is never emitted.\n",
  discriminator: {
    mapping: {
      cash_dividend_corporateaction_event:
        "#/components/schemas/corporate_action_event_cash_dividend",
      cash_merger_corporateaction_event:
        "#/components/schemas/corporate_action_event_cash_merger",
      equity_partial_call_corporateaction_event:
        "#/components/schemas/corporate_action_event_equity_partial_call",
      forward_split_corporateaction_event:
        "#/components/schemas/corporate_action_event_forward_split",
      name_change_corporateaction_event:
        "#/components/schemas/corporate_action_event_name_change",
      redemption_corporateaction_event:
        "#/components/schemas/corporate_action_event_redemption",
      reorganization_corporateaction_event:
        "#/components/schemas/corporate_action_event_reorganization",
      reverse_split_corporateaction_event:
        "#/components/schemas/corporate_action_event_reverse_split",
      rights_distribution_corporateaction_event:
        "#/components/schemas/corporate_action_event_rights_distribution",
      spin_off_corporateaction_event:
        "#/components/schemas/corporate_action_event_spin_off",
      stock_and_cash_merger_corporateaction_event:
        "#/components/schemas/corporate_action_event_stock_and_cash_merger",
      stock_dividend_corporateaction_event:
        "#/components/schemas/corporate_action_event_stock_dividend",
      stock_merger_corporateaction_event:
        "#/components/schemas/corporate_action_event_stock_merger",
      unit_split_corporateaction_event:
        "#/components/schemas/corporate_action_event_unit_split",
      worthless_removal_corporateaction_event:
        "#/components/schemas/corporate_action_event_worthless_removal",
    },
    propertyName: "event_type",
  },
  oneOf: [
    {
      $ref: "#/components/schemas/corporate_action_event_cash_dividend",
    },
    { $ref: "#/components/schemas/corporate_action_event_cash_merger" },
    {
      $ref: "#/components/schemas/corporate_action_event_equity_partial_call",
    },
    {
      $ref: "#/components/schemas/corporate_action_event_forward_split",
    },
    { $ref: "#/components/schemas/corporate_action_event_name_change" },
    { $ref: "#/components/schemas/corporate_action_event_redemption" },
    {
      $ref: "#/components/schemas/corporate_action_event_reorganization",
    },
    {
      $ref: "#/components/schemas/corporate_action_event_reverse_split",
    },
    {
      $ref: "#/components/schemas/corporate_action_event_rights_distribution",
    },
    { $ref: "#/components/schemas/corporate_action_event_spin_off" },
    {
      $ref: "#/components/schemas/corporate_action_event_stock_and_cash_merger",
    },
    {
      $ref: "#/components/schemas/corporate_action_event_stock_dividend",
    },
    {
      $ref: "#/components/schemas/corporate_action_event_stock_merger",
    },
    { $ref: "#/components/schemas/corporate_action_event_unit_split" },
    {
      $ref: "#/components/schemas/corporate_action_event_worthless_removal",
    },
  ],
};

export const corporate_action_event_action= {
  description:
    "Kind of mutation that produced this event on the upstream corporate actions\nstore:\n\n- `insert`: a new corporate action was created.\n- `update`: an existing corporate action was modified (e.g. a date or rate\n  correction). `ca.id` matches the original event.\n- `delete`: a previously published corporate action was removed. `ca.id`\n  matches the original event; subsequent events for the same id (if any)\n  will be new inserts.\n",
  enum: ["insert", "update", "delete"],
  type: "string",
};

export const corporate_action_event_base= {
  description:
    "Common envelope fields shared by every variant of\n[`corporate_action_event`](#/components/schemas/corporate_action_event).\nThis schema is not meant to be used directly by clients -- it exists so each\nper-`event_type` `oneOf` branch can `allOf`-compose the envelope basics\n(`event_id`, `at`, `action`, `region`) alongside its narrowed `event_type` /\n`ca` pair. Keeping these in one place is what makes the envelope's\n`discriminator` play nicely with strict OpenAPI validators.\n",
  properties: {
    action: {
      $ref: "#/components/schemas/corporate_action_event_action",
    },
    at: {
      description:
        "RFC-3339 timestamp when the streaming service emitted this event.",
      examples: ["2026-03-20T12:24:58.807230Z"],
      format: "date-time",
      type: "string",
    },
    event_id: { $ref: "#/components/schemas/event_id" },
    region: {
      $ref: "#/components/schemas/corporate_action_event_region",
    },
  },
  required: ["event_id", "at", "action", "region"],
  type: "object",
};

export const corporate_action_event_cash_dividend= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: { $ref: "#/components/schemas/ca_event_cash_dividend" },
        event_type: {
          enum: ["cash_dividend_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\ncash_dividend_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_cash_merger= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: { $ref: "#/components/schemas/ca_event_cash_merger" },
        event_type: {
          enum: ["cash_merger_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\ncash_merger_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_equity_partial_call= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: {
          $ref: "#/components/schemas/ca_event_equity_partial_call",
        },
        event_type: {
          enum: ["equity_partial_call_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nequity_partial_call_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_forward_split= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: { $ref: "#/components/schemas/ca_event_forward_split" },
        event_type: {
          enum: ["forward_split_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nforward_split_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_name_change= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: { $ref: "#/components/schemas/ca_event_name_change" },
        event_type: {
          enum: ["name_change_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nname_change_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_redemption= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: { $ref: "#/components/schemas/ca_event_redemption" },
        event_type: {
          enum: ["redemption_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nredemption_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_region= {
  description:
    "Envelope-level classification derived from `metadata.global` on the upstream\ncorporate-action record. This is the only field the SSE `region` filter\ninspects on each event.\n\n- `us`: US-listed / US-regulated corporate action.\n- `non_us`: everything else.\n",
  enum: ["us", "non_us"],
  type: "string",
};

export const corporate_action_event_reorganization= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: { $ref: "#/components/schemas/ca_event_reorganization" },
        event_type: {
          enum: ["reorganization_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nreorganization_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_reverse_split= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: { $ref: "#/components/schemas/ca_event_reverse_split" },
        event_type: {
          enum: ["reverse_split_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nreverse_split_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_rights_distribution= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: {
          $ref: "#/components/schemas/ca_event_rights_distribution",
        },
        event_type: {
          enum: ["rights_distribution_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nrights_distribution_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_spin_off= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: { $ref: "#/components/schemas/ca_event_spin_off" },
        event_type: {
          enum: ["spin_off_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nspin_off_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_stock_and_cash_merger= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: {
          $ref: "#/components/schemas/ca_event_stock_and_cash_merger",
        },
        event_type: {
          enum: ["stock_and_cash_merger_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nstock_and_cash_merger_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_stock_dividend= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: { $ref: "#/components/schemas/ca_event_stock_dividend" },
        event_type: {
          enum: ["stock_dividend_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nstock_dividend_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_stock_merger= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: { $ref: "#/components/schemas/ca_event_stock_merger" },
        event_type: {
          enum: ["stock_merger_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nstock_merger_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_type= {
  description:
    "Discriminator that determines the shape of the `ca` field on a\n[`corporate_action_event`](#/components/schemas/corporate_action_event).\n\nEach value corresponds to a per-type payload schema:\n\n| `event_type` | `ca` schema |\n| --- | --- |\n| `cash_dividend_corporateaction_event` | [`ca_event_cash_dividend`](#/components/schemas/ca_event_cash_dividend) |\n| `cash_merger_corporateaction_event` | [`ca_event_cash_merger`](#/components/schemas/ca_event_cash_merger) |\n| `equity_partial_call_corporateaction_event` | [`ca_event_equity_partial_call`](#/components/schemas/ca_event_equity_partial_call) |\n| `forward_split_corporateaction_event` | [`ca_event_forward_split`](#/components/schemas/ca_event_forward_split) |\n| `name_change_corporateaction_event` | [`ca_event_name_change`](#/components/schemas/ca_event_name_change) |\n| `redemption_corporateaction_event` | [`ca_event_redemption`](#/components/schemas/ca_event_redemption) |\n| `reorganization_corporateaction_event` | [`ca_event_reorganization`](#/components/schemas/ca_event_reorganization) |\n| `reverse_split_corporateaction_event` | [`ca_event_reverse_split`](#/components/schemas/ca_event_reverse_split) |\n| `rights_distribution_corporateaction_event` | [`ca_event_rights_distribution`](#/components/schemas/ca_event_rights_distribution) |\n| `spin_off_corporateaction_event` | [`ca_event_spin_off`](#/components/schemas/ca_event_spin_off) |\n| `stock_and_cash_merger_corporateaction_event` | [`ca_event_stock_and_cash_merger`](#/components/schemas/ca_event_stock_and_cash_merger) |\n| `stock_dividend_corporateaction_event` | [`ca_event_stock_dividend`](#/components/schemas/ca_event_stock_dividend) |\n| `stock_merger_corporateaction_event` | [`ca_event_stock_merger`](#/components/schemas/ca_event_stock_merger) |\n| `unit_split_corporateaction_event` | [`ca_event_unit_split`](#/components/schemas/ca_event_unit_split) |\n| `worthless_removal_corporateaction_event` | [`ca_event_worthless_removal`](#/components/schemas/ca_event_worthless_removal) |\n",
  enum: [
    "cash_dividend_corporateaction_event",
    "cash_merger_corporateaction_event",
    "equity_partial_call_corporateaction_event",
    "forward_split_corporateaction_event",
    "name_change_corporateaction_event",
    "redemption_corporateaction_event",
    "reorganization_corporateaction_event",
    "reverse_split_corporateaction_event",
    "rights_distribution_corporateaction_event",
    "spin_off_corporateaction_event",
    "stock_and_cash_merger_corporateaction_event",
    "stock_dividend_corporateaction_event",
    "stock_merger_corporateaction_event",
    "unit_split_corporateaction_event",
    "worthless_removal_corporateaction_event",
  ],
  type: "string",
};

export const corporate_action_event_unit_split= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: { $ref: "#/components/schemas/ca_event_unit_split" },
        event_type: {
          enum: ["unit_split_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nunit_split_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_action_event_worthless_removal= {
  allOf: [
    { $ref: "#/components/schemas/corporate_action_event_base" },
    {
      properties: {
        ca: {
          $ref: "#/components/schemas/ca_event_worthless_removal",
        },
        event_type: {
          enum: ["worthless_removal_corporateaction_event"],
          type: "string",
        },
      },
      required: ["event_type", "ca"],
      type: "object",
    },
  ],
  description:
    "`corporate_action_event` envelope specialised to `event_type ==\nworthless_removal_corporateaction_event`. Emitted through\n[Corporate Actions Events Stream](#operation/SubscribeToCorporateActionsEventsSSE).\n",
};

export const corporate_actions= {
  properties: {
    cash_dividends: {
      items: { $ref: "#/components/schemas/cash_dividend" },
      type: "array",
    },
    cash_mergers: {
      items: { $ref: "#/components/schemas/cash_merger" },
      type: "array",
    },
    forward_splits: {
      items: { $ref: "#/components/schemas/forward_split" },
      type: "array",
    },
    name_changes: {
      items: { $ref: "#/components/schemas/name_change" },
      type: "array",
    },
    partial_calls: {
      items: { $ref: "#/components/schemas/partial_call" },
      type: "array",
    },
    redemptions: {
      items: { $ref: "#/components/schemas/redemption" },
      type: "array",
    },
    reorganizations: {
      items: { $ref: "#/components/schemas/reorganization" },
      type: "array",
    },
    reverse_splits: {
      items: { $ref: "#/components/schemas/reverse_split" },
      type: "array",
    },
    rights_distributions: {
      items: { $ref: "#/components/schemas/rights_distribution" },
      type: "array",
    },
    spin_offs: {
      items: { $ref: "#/components/schemas/spin_off" },
      type: "array",
    },
    stock_and_cash_mergers: {
      items: { $ref: "#/components/schemas/stock_and_cash_merger" },
      type: "array",
    },
    stock_dividends: {
      items: { $ref: "#/components/schemas/stock_dividend" },
      type: "array",
    },
    stock_mergers: {
      items: { $ref: "#/components/schemas/stock_merger" },
      type: "array",
    },
    unit_splits: {
      items: { $ref: "#/components/schemas/unit_split" },
      type: "array",
    },
    worthless_removals: {
      items: { $ref: "#/components/schemas/worthless_removal" },
      type: "array",
    },
  },
  type: "object",
};

export const corporate_actions_resp= {
  properties: {
    corporate_actions: {
      $ref: "#/components/schemas/corporate_actions",
    },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
  },
  required: ["corporate_actions", "next_page_token"],
  type: "object",
};

export const crypto_bar= {
  description: "OHLC aggregate of all the trades in a given interval.",
  examples: [
    {
      c: 29003,
      h: 29003,
      l: 28999,
      n: 4,
      o: 28999,
      t: "2022-05-27T10:18:00Z",
      v: 0.01,
      vw: 29001,
    },
  ],
  properties: {
    c: {
      description: "Closing price.",
      format: "double",
      type: "number",
    },
    h: {
      description: "High price.",
      format: "double",
      type: "number",
    },
    l: {
      description: "Low price.",
      format: "double",
      type: "number",
    },
    n: {
      description: "Trade count in the bar.",
      format: "int64",
      type: "integer",
    },
    o: {
      description: "Opening price.",
      format: "double",
      type: "number",
    },
    t: { $ref: "#/components/schemas/timestamp" },
    v: {
      description: "Bar volume.",
      format: "double",
      type: "number",
    },
    vw: {
      description: "Volume weighted average price.",
      format: "double",
      type: "number",
    },
  },
  required: ["t", "o", "h", "l", "c", "v", "n", "vw"],
  type: "object",
};

export const crypto_bars_resp= {
  properties: {
    bars: {
      additionalProperties: {
        items: { $ref: "#/components/schemas/crypto_bar" },
        type: "array",
      },
      type: "object",
    },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
  },
  required: ["bars", "next_page_token"],
  type: "object",
};

export const crypto_historical_loc= {
  description:
    "Crypto location from where the historical market data is retrieved.",
  enum: ["us", "us-1", "us-2", "eu-1", "bs-1"],
  type: "string",
};

export const crypto_latest_bars_resp= {
  properties: {
    bars: {
      additionalProperties: {
        $ref: "#/components/schemas/crypto_bar",
      },
      type: "object",
    },
  },
  required: ["bars"],
  type: "object",
};

export const crypto_latest_loc= {
  description:
    "Crypto location from where the latest market data is retrieved.",
  enum: ["us", "us-1", "us-2", "eu-1", "bs-1"],
  type: "string",
};

export const crypto_latest_orderbooks_resp= {
  properties: {
    orderbooks: {
      additionalProperties: {
        $ref: "#/components/schemas/crypto_orderbook",
      },
      type: "object",
    },
  },
  required: ["orderbooks"],
  type: "object",
};

export const crypto_latest_quotes_resp= {
  properties: {
    quotes: {
      additionalProperties: {
        $ref: "#/components/schemas/crypto_quote",
      },
      type: "object",
    },
  },
  required: ["quotes"],
  type: "object",
};

export const crypto_latest_trades_resp= {
  properties: {
    trades: {
      additionalProperties: {
        $ref: "#/components/schemas/crypto_trade",
      },
      type: "object",
    },
  },
  required: ["trades"],
  type: "object",
};

export const crypto_orderbook= {
  description: "Snapshot of the orderbook.",
  examples: [
    {
      a: [
        { p: 20902, s: 0.0097 },
        { p: 21444, s: 0 },
      ],
      b: [
        { p: 20846, s: 0.1902 },
        { p: 20350, s: 0 },
      ],
      t: "2022-06-24T08:00:14.137774336Z",
    },
  ],
  properties: {
    a: {
      items: { $ref: "#/components/schemas/crypto_orderbook_entry" },
      type: "array",
    },
    b: {
      items: { $ref: "#/components/schemas/crypto_orderbook_entry" },
      type: "array",
    },
    t: { $ref: "#/components/schemas/timestamp" },
  },
  required: ["t", "b", "a"],
  type: "object",
};

export const crypto_orderbook_entry= {
  description: "A single entry in a crypto orderbook.",
  examples: [{ p: 20846, s: 0.1902 }],
  properties: {
    p: {
      description: "Price.",
      format: "double",
      type: "number",
    },
    s: { description: "Size.", format: "double", type: "number" },
  },
  required: ["p", "s"],
  type: "object",
};

export const crypto_quote= {
  description: "The best bid and ask information for a given security.",
  examples: [
    {
      ap: 29059,
      as: 3.252,
      bp: 29058,
      bs: 0.3544,
      t: "2022-05-26T11:47:18.44347136Z",
    },
  ],
  properties: {
    ap: {
      description: "Ask price.",
      format: "double",
      type: "number",
    },
    as: {
      description: "Ask size.",
      format: "double",
      type: "number",
    },
    bp: {
      description: "Bid price.",
      format: "double",
      type: "number",
    },
    bs: {
      description: "Bid size.",
      format: "double",
      type: "number",
    },
    t: { $ref: "#/components/schemas/timestamp" },
  },
  required: ["t", "bp", "bs", "ap", "as"],
  type: "object",
};

export const crypto_quotes_resp= {
  properties: {
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
    quotes: {
      additionalProperties: {
        items: { $ref: "#/components/schemas/crypto_quote" },
        type: "array",
      },
      type: "object",
    },
  },
  required: ["quotes", "next_page_token"],
  type: "object",
};

export const crypto_snapshot= {
  description:
    "A snapshot provides the latest trade, latest quote, latest minute bar, latest daily bar and previous daily bar.\n",
  properties: {
    dailyBar: { $ref: "#/components/schemas/crypto_bar" },
    latestQuote: { $ref: "#/components/schemas/crypto_quote" },
    latestTrade: { $ref: "#/components/schemas/crypto_trade" },
    minuteBar: { $ref: "#/components/schemas/crypto_bar" },
    prevDailyBar: { $ref: "#/components/schemas/crypto_bar" },
  },
  type: "object",
};

export const crypto_snapshots_resp= {
  properties: {
    snapshots: {
      additionalProperties: {
        $ref: "#/components/schemas/crypto_snapshot",
      },
      type: "object",
    },
  },
  required: ["snapshots"],
  type: "object",
};

export const crypto_trade= {
  description: "A crypto trade.",
  examples: [
    {
      i: 31455277,
      p: 29798,
      s: 0.1209,
      t: "2022-05-18T12:00:05.225055Z",
      tks: "S",
    },
  ],
  properties: {
    i: {
      description: "Trade ID.",
      format: "int64",
      type: "integer",
    },
    p: {
      description: "Trade price.",
      format: "double",
      type: "number",
    },
    s: {
      description: "Trade size.",
      format: "double",
      type: "number",
    },
    t: { $ref: "#/components/schemas/timestamp" },
    tks: {
      description: "Taker side: B for buyer, S for seller\n",
      type: "string",
    },
  },
  required: ["t", "p", "s", "i", "tks"],
  type: "object",
};

export const crypto_trades_resp= {
  properties: {
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
    trades: {
      additionalProperties: {
        items: { $ref: "#/components/schemas/crypto_trade" },
        type: "array",
      },
      type: "object",
    },
  },
  required: ["trades", "next_page_token"],
  type: "object",
};

export const currency= {
  description:
    "The ISO 4217 currency code associated with the corporate action.\nEmpty value can mean USD, non-applicable (e.g. for name changes) or unknown\n(can change later to a valid currency).\n",
  type: "string",
};

export const data_quality= {
  default: "complete",
  description:
    "Controls which corporate actions are returned based on data quality.\n\n- `complete` (default): exclude corporate actions that are still missing required\n  fields (for example, ex-date or CUSIP/ISIN) and have not yet been processed.\n  Already-processed corporate actions are always included, even if they would\n  otherwise be considered incomplete.\n- `all`: return matching corporate actions regardless of field completeness.\n",
  enum: ["complete", "all"],
  type: "string",
};

export const date= {
  description: "Date in RFC-3339.",
  format: "date",
  type: "string",
};

export const due_bill_redemption_date= {
  description: "The date when due bill obligations are redeemed.",
  format: "date",
  type: "string",
};

export const effective_date= {
  description:
    "The effective date marks the cutoff point for shareholders to be credited.",
  format: "date",
  type: "string",
};

export const event_id= {
  description:
    "Lexically sortable, monotonically increasing 26-character\n[ULID](https://github.com/ulid/spec) (Crockford Base32, uppercase) that\nidentifies a single SSE emission. Unique per message -- an `update` or\n`delete` for the same underlying corporate action carries a fresh\n`event_id`. Because ULIDs sort in emission order, they can be used as\nresume cursors via `since_id`, `until_id`, or the standard `Last-Event-Id`\nreconnect header.\n",
  examples: ["01J9RPMV5TKB8WX3M4F1KZ7QH2"],
  format: "ulid",
  pattern: "^[0-7][0-9A-HJKMNP-TV-Z]{25}$",
  type: "string",
};

export const ex_date= {
  description:
    "The ex-date marks the cutoff point for shareholders to be credited.",
  format: "date",
  type: "string",
};

export const expiration_date= { format: "date", type: "string" };

export const fixed_income_latest_prices_resp= {
  properties: {
    prices: {
      additionalProperties: {
        $ref: "#/components/schemas/fixed_income_price",
      },
      type: "object",
    },
  },
  required: ["prices"],
  type: "object",
};

export const fixed_income_latest_quotes_resp= {
  properties: {
    quotes: {
      additionalProperties: {
        $ref: "#/components/schemas/fixed_income_quote",
      },
      type: "object",
    },
  },
  required: ["quotes"],
  type: "object",
};

export const fixed_income_price= {
  description:
    "The price of the instrument as a percentage of its par value.",
  examples: [
    {
      p: 99.6459,
      t: "2025-02-14T20:58:00.648Z",
      ytm: 4.249,
      ytw: 4.249,
    },
  ],
  properties: {
    p: { description: "Price", format: "double", type: "number" },
    t: { $ref: "#/components/schemas/timestamp" },
    ytm: {
      description: "Yield to maturity.",
      format: "double",
      type: "number",
    },
    ytw: {
      description: "Yield to worst.",
      format: "double",
      type: "number",
    },
  },
  required: ["t", "p"],
  type: "object",
};

export const fixed_income_quote= {
  description:
    "The best bid and ask information for a given fixed income security. A value of 0 means there is no active bid or ask for that field.\n",
  examples: [
    {
      ams: 1000,
      ap: 99.91958333,
      as: 1000000,
      aytm: 2.226923,
      aytw: 2.226923,
      bms: 1000,
      bp: 99.81091667,
      bs: 1000000,
      bytm: 5.236154,
      bytw: 5.236154,
      t: "2026-05-21T06:56:01.882466873Z",
    },
  ],
  properties: {
    ams: {
      description: "Best ask minimum trade size in par value.",
      format: "int64",
      type: "integer",
    },
    ap: {
      description: "Best ask price. 0 means there is no active ask.",
      format: "double",
      type: "number",
    },
    as: {
      description:
        "Best ask size in par value. 0 means there is no active ask.",
      format: "int64",
      type: "integer",
    },
    aytm: {
      description: "Best ask yield to maturity.",
      format: "double",
      type: "number",
    },
    aytw: {
      description: "Best ask yield to worst.",
      format: "double",
      type: "number",
    },
    bms: {
      description: "Best bid minimum trade size in par value.",
      format: "int64",
      type: "integer",
    },
    bp: {
      description: "Best bid price. 0 means there is no active bid.",
      format: "double",
      type: "number",
    },
    bs: {
      description:
        "Best bid size in par value. 0 means there is no active bid.",
      format: "int64",
      type: "integer",
    },
    bytm: {
      description: "Best bid yield to maturity.",
      format: "double",
      type: "number",
    },
    bytw: {
      description: "Best bid yield to worst.",
      format: "double",
      type: "number",
    },
    t: { $ref: "#/components/schemas/timestamp" },
  },
  required: [
    "t",
    "bp",
    "bs",
    "bms",
    "bytm",
    "bytw",
    "ap",
    "as",
    "ams",
    "aytm",
    "aytw",
  ],
  type: "object",
};

export const forex_currency_pairs= {
  description: "A comma-separated string with currency pairs.",
  examples: ["USDJPY", "USDMXN"],
  type: "string",
};

export const forex_latest_rates_resp= {
  description: "The response object of the latest forex rates.",
  properties: {
    rates: {
      additionalProperties: {
        $ref: "#/components/schemas/forex_rate",
      },
      type: "object",
    },
  },
  required: ["rates"],
  type: "object",
};

export const forex_rate= {
  description:
    "A foreign exchange rate between two currencies at a given time.",
  examples: [
    {
      ap: 127.763,
      bp: 127.702,
      mp: 127.757,
      t: "2022-04-20T18:23:00Z",
    },
  ],
  properties: {
    ap: {
      description:
        "The last ask price value of the currency at the end of the timeframe.",
      format: "double",
      type: "number",
    },
    bp: {
      description:
        "The last bid price value of the currency at the end of the timeframe.",
      format: "double",
      type: "number",
    },
    mp: {
      description:
        "The last mid price value of the currency at the end of the timeframe.",
      format: "double",
      type: "number",
    },
    t: {
      description: "Timestamp of the rate.",
      format: "date-time",
      type: "string",
    },
  },
  required: ["bp", "mp", "ap", "t"],
  type: "object",
};

export const forex_rates_resp= {
  properties: {
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
    rates: {
      additionalProperties: {
        items: { $ref: "#/components/schemas/forex_rate" },
        type: "array",
      },
      type: "object",
    },
  },
  required: ["rates", "next_page_token"],
  type: "object",
};

export const forex_timeframe= {
  default: "1Min",
  description:
    "The sampling interval of the currency rates. For example, 5S returns forex rates sampled every five seconds.\nYou can use the following values:\n - `5Sec` or `5S`\n - `1Min` or `1T`\n - `1Day` or `1D`\n",
  type: "string",
};

export const forward_split= {
  description: "Forward split.",
  examples: [
    {
      cusip: "816851109",
      due_bill_redemption_date: "2023-08-23",
      ex_date: "2023-08-22",
      id: "189bd849-ab9f-4b4d-aaaa-a6d415fd976d",
      new_rate: 2,
      old_rate: 1,
      payable_date: "2023-08-21",
      process_date: "2023-08-22",
      record_date: "2023-08-14",
      symbol: "SRE",
    },
  ],
  properties: {
    currency: { $ref: "#/components/schemas/currency" },
    cusip: { type: "string" },
    due_bill_redemption_date: {
      $ref: "#/components/schemas/due_bill_redemption_date",
    },
    ex_date: { $ref: "#/components/schemas/ex_date" },
    id: { $ref: "#/components/schemas/ca_id" },
    isin: { $ref: "#/components/schemas/isin" },
    new_rate: { format: "double", type: "number" },
    old_rate: { format: "double", type: "number" },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    process_date: { $ref: "#/components/schemas/process_date" },
    record_date: { $ref: "#/components/schemas/record_date" },
    symbol: { type: "string" },
  },
  required: [
    "id",
    "symbol",
    "cusip",
    "new_rate",
    "old_rate",
    "process_date",
    "ex_date",
  ],
  type: "object",
};

export const isin= {
  description:
    "International Securities Identification Number (ISIN) as defined by ISO 6166.\nMay be empty for US corporate actions.\n",
  type: "string",
};

export const market_type= {
  description: "Market type (stocks or crypto).",
  enum: ["stocks", "crypto"],
  type: "string",
};

export const most_active= {
  description: "A stock that is most active by either volume or trade count.",
  examples: [{ symbol: "AAPL", trade_count: 639626, volume: 122709184 }],
  properties: {
    symbol: { type: "string" },
    trade_count: {
      description: "Cumulative trade count for the current trading day.",
      format: "int64",
      type: "integer",
    },
    volume: {
      description: "Cumulative volume for the current trading day.",
      format: "int64",
      type: "integer",
    },
  },
  required: ["symbol", "volume", "trade_count"],
  type: "object",
};

export const most_actives_resp= {
  properties: {
    last_updated: {
      description:
        "Time when the most actives were last computed. Formatted as a RFC-3339 date-time with nanosecond precision.\n",
      type: "string",
    },
    most_actives: {
      description: "List of top N most active symbols.",
      items: { $ref: "#/components/schemas/most_active" },
      type: "array",
    },
  },
  required: ["most_actives", "last_updated"],
  type: "object",
};

export const mover= {
  description: "A symbol whose price moved significantly.",
  examples: [
    {
      change: 2.46,
      percent_change: 145.56,
      price: 4.15,
      symbol: "AGRI",
    },
  ],
  properties: {
    change: {
      description: "Difference in change for the day.",
      format: "double",
      type: "number",
    },
    percent_change: {
      description: "Percentage difference change for the day.",
      format: "double",
      type: "number",
    },
    price: {
      description: "Current price of market moving asset.",
      format: "double",
      type: "number",
    },
    symbol: {
      description: "Symbol of market moving asset.",
      type: "string",
    },
  },
  required: ["symbol", "percent_change", "change", "price"],
  title: "Mover",
  type: "object",
};

export const movers_resp= {
  description: "Contains list of market movers.",
  properties: {
    gainers: {
      description: "List of top N gainers.",
      items: { $ref: "#/components/schemas/mover" },
      type: "array",
    },
    last_updated: {
      description:
        "Time when the movers were last computed. Formatted as a RFC-3339 date-time with nanosecond precision.\n",
      type: "string",
    },
    losers: {
      description: "List of top N losers.",
      items: { $ref: "#/components/schemas/mover" },
      type: "array",
    },
    market_type: { $ref: "#/components/schemas/market_type" },
  },
  required: ["gainers", "losers", "market_type", "last_updated"],
  type: "object",
};

export const name_change= {
  description: "Name change.",
  examples: [
    {
      id: "5a774c35-edec-4532-a812-a56d0bbb623a",
      new_cusip: "Y9390M103",
      new_symbol: "VFS",
      old_cusip: "G11537100",
      old_symbol: "BSAQ",
      process_date: "2023-08-15",
    },
  ],
  properties: {
    currency: { $ref: "#/components/schemas/currency" },
    id: { $ref: "#/components/schemas/ca_id" },
    new_cusip: { type: "string" },
    new_isin: { $ref: "#/components/schemas/isin" },
    new_symbol: { type: "string" },
    old_cusip: { type: "string" },
    old_isin: { $ref: "#/components/schemas/isin" },
    old_symbol: { type: "string" },
    process_date: { $ref: "#/components/schemas/process_date" },
  },
  required: [
    "id",
    "old_symbol",
    "old_cusip",
    "new_symbol",
    "new_cusip",
    "process_date",
  ],
  type: "object",
};

export const news= {
  description: "Model representing a news article.",
  properties: {
    author: {
      description: "Original author of news article.",
      minLength: 1,
      type: "string",
    },
    content: {
      description: "Content of the news article (might contain HTML).",
      minLength: 1,
      type: "string",
    },
    created_at: {
      description: "Date article was created (RFC-3339).",
      format: "date-time",
      type: "string",
    },
    headline: {
      description: "Headline or title of the article.",
      minLength: 1,
      type: "string",
    },
    id: {
      description: "News article ID.",
      format: "int64",
      type: "integer",
    },
    images: {
      description:
        "List of images (URLs) related to given article (may be empty).",
      items: { $ref: "#/components/schemas/news_image" },
      type: "array",
      uniqueItems: true,
    },
    source: {
      description: "Source where the news originated from (e.g. Benzinga).",
      minLength: 1,
      type: "string",
    },
    summary: {
      description:
        "Summary text for the article (may be first sentence of content).",
      minLength: 1,
      type: "string",
    },
    symbols: {
      description: "List of related or mentioned symbols.",
      items: { type: "string" },
      type: "array",
    },
    updated_at: {
      description: "Date article was updated (RFC-3339).",
      format: "date-time",
      type: "string",
    },
    url: {
      description: "URL of article (if applicable).",
      format: "uri",
      type: ["string", "null"],
    },
  },
  required: [
    "id",
    "headline",
    "author",
    "created_at",
    "updated_at",
    "summary",
    "content",
    "images",
    "symbols",
    "source",
  ],
  type: "object",
};

export const news_image= {
  description:
    "A model representing images for a news article. Simply a URL to the image along with a size parameter suggesting the display size of the image.",
  properties: {
    size: {
      description: "Possible values for size are thumb, small and large.",
      enum: ["thumb", "small", "large"],
      examples: ["thumb"],
      minLength: 1,
      type: "string",
    },
    url: {
      description: "URL to image from news article.",
      format: "uri",
      minLength: 1,
      type: "string",
    },
  },
  required: ["size", "url"],
  type: "object",
};

export const news_resp= {
  properties: {
    news: {
      items: { $ref: "#/components/schemas/news" },
      type: "array",
    },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
  },
  required: ["news", "next_page_token"],
  type: "object",
};

export const next_page_token= {
  description: "Pagination token for the next page.",
  type: ["string", "null"],
};

export const option_bar= {
  description: "OHLC aggregate of all the trades in a given interval.",
  examples: [
    {
      c: 0.23,
      h: 0.28,
      l: 0.23,
      n: 26,
      o: 0.28,
      t: "2024-01-18T05:00:00Z",
      v: 224,
      vw: 0.245045,
    },
  ],
  properties: {
    c: {
      description: "Closing price.",
      format: "double",
      type: "number",
    },
    h: {
      description: "High price.",
      format: "double",
      type: "number",
    },
    l: {
      description: "Low price.",
      format: "double",
      type: "number",
    },
    n: {
      description: "Trade count in the bar.",
      format: "int64",
      type: "integer",
    },
    o: {
      description: "Opening price.",
      format: "double",
      type: "number",
    },
    t: { $ref: "#/components/schemas/timestamp" },
    v: {
      description: "Bar volume.",
      format: "int64",
      type: "integer",
    },
    vw: {
      description: "Volume weighted average price.",
      format: "double",
      type: "number",
    },
  },
  required: ["t", "o", "h", "l", "c", "v", "n", "vw"],
  type: "object",
};

export const option_bars_resp= {
  properties: {
    bars: {
      additionalProperties: {
        items: { $ref: "#/components/schemas/option_bar" },
        type: "array",
      },
      type: "object",
    },
    currency: { type: "string" },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
  },
  required: ["bars", "next_page_token"],
  type: "object",
};

export const option_conditions= {
  additionalProperties: { type: "string" },
  examples: [
    {
      a: "SLAN - Single Leg Auction Non ISO",
      e: "SLFT - Single Leg Floor Trade",
      g: "MLAT - Multi Leg Auction",
    },
  ],
  type: "object",
};

export const option_exchanges= {
  additionalProperties: { type: "string" },
  examples: [{ A: "NYSE American Options", Q: "Nasdaq Options" }],
  type: "object",
};

export const option_feed= {
  default: "opra",
  enum: ["opra", "indicative"],
  type: "string",
};

export const option_greeks= {
  description:
    "The greeks for the contract calculated using the Black-Scholes model.",
  properties: {
    delta: { format: "double", type: "number" },
    gamma: { format: "double", type: "number" },
    rho: { format: "double", type: "number" },
    theta: { format: "double", type: "number" },
    vega: { format: "double", type: "number" },
  },
  required: ["delta", "gamma", "theta", "vega", "rho"],
  type: "object",
};

export const option_latest_quotes_resp= {
  properties: {
    quotes: {
      additionalProperties: {
        $ref: "#/components/schemas/option_quote",
      },
      type: "object",
    },
  },
  required: ["quotes"],
  type: "object",
};

export const option_latest_trades_resp= {
  properties: {
    trades: {
      additionalProperties: {
        $ref: "#/components/schemas/option_trade",
      },
      type: "object",
    },
  },
  required: ["trades"],
  type: "object",
};

export const option_quote= {
  description: "The best bid and ask information for a given option.\n",
  examples: [
    {
      ap: 0.16,
      as: 669,
      ax: "w",
      bp: 0.15,
      bs: 164,
      bx: "W",
      c: "A",
      t: "2024-02-28T15:30:28.046330624Z",
    },
  ],
  properties: {
    ap: {
      description: "Ask price.",
      format: "double",
      type: "number",
    },
    as: {
      description: "Ask size.",
      format: "uint32",
      type: "integer",
    },
    ax: { description: "Ask exchange.", type: "string" },
    bp: {
      description: "Bid price.",
      format: "double",
      type: "number",
    },
    bs: {
      description: "Bid size.",
      format: "uint32",
      type: "integer",
    },
    bx: { description: "Bid exchange.", type: "string" },
    c: { description: "Quote condition.", type: "string" },
    t: { $ref: "#/components/schemas/timestamp" },
  },
  required: ["t", "bx", "bp", "bs", "ap", "as", "ax", "c"],
  type: "object",
};

export const option_snapshot= {
  description: "A snapshot provides the latest trade and latest quote.",
  properties: {
    dailyBar: { $ref: "#/components/schemas/option_bar" },
    greeks: { $ref: "#/components/schemas/option_greeks" },
    impliedVolatility: {
      description:
        "Implied volatility calculated using the Black-Scholes model.",
      format: "double",
      type: "number",
    },
    latestQuote: { $ref: "#/components/schemas/option_quote" },
    latestTrade: { $ref: "#/components/schemas/option_trade" },
    minuteBar: { $ref: "#/components/schemas/option_bar" },
    prevDailyBar: { $ref: "#/components/schemas/option_bar" },
  },
  type: "object",
};

export const option_snapshots_resp= {
  properties: {
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
    snapshots: {
      additionalProperties: {
        $ref: "#/components/schemas/option_snapshot",
      },
      type: "object",
    },
  },
  required: ["snapshots", "next_page_token"],
  type: "object",
};

export const option_trade= {
  description: "An option trade.",
  examples: [
    {
      c: "I",
      p: 0.37,
      s: 1,
      t: "2024-01-18T15:03:44.56339456Z",
      x: "B",
    },
  ],
  properties: {
    c: { description: "Trade condition.", type: "string" },
    p: {
      description: "Trade price.",
      format: "double",
      type: "number",
    },
    s: {
      description: "Trade size.",
      format: "uint32",
      type: "integer",
    },
    t: { $ref: "#/components/schemas/timestamp" },
    x: { type: "string" },
  },
  required: ["t", "x", "p", "s", "c"],
  type: "object",
};

export const option_trades_resp= {
  properties: {
    currency: { type: "string" },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
    trades: {
      additionalProperties: {
        items: { $ref: "#/components/schemas/option_trade" },
        type: "array",
      },
      type: "object",
    },
  },
  required: ["trades", "next_page_token"],
  type: "object",
};

export const partial_call= {
  description: "Partial call.",
  properties: {
    currency: { $ref: "#/components/schemas/currency" },
    cusip: { type: "string" },
    dividend_rate: { format: "double", type: "number" },
    id: { $ref: "#/components/schemas/ca_id" },
    isin: { $ref: "#/components/schemas/isin" },
    lottery_date: { format: "date", type: "string" },
    lottery_type: {
      description: "The type of lottery for the partial call.",
      enum: ["original", "supplemental"],
      type: "string",
    },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    price: { format: "double", type: "number" },
    process_date: { $ref: "#/components/schemas/process_date" },
    record_date: { $ref: "#/components/schemas/record_date" },
    results_publication_date: { format: "date", type: "string" },
    symbol: { type: "string" },
  },
  required: ["id", "symbol", "process_date"],
  type: "object",
};

export const payable_date= {
  description:
    "The date when the corporate action benefit is paid or distributed.",
  format: "date",
  type: "string",
};

export const process_date= {
  description: "The date when the corporate action is processed by Alpaca.",
  format: "date",
  type: "string",
};

export const record_date= {
  description:
    "The date shareholders must own shares to receive the benefit.",
  format: "date",
  type: "string",
};

export const redemption= {
  description: "Redemption.",
  examples: [
    {
      cusip: "687305102",
      id: "395da031-0e57-4918-a6fb-64a7c713aca4",
      payable_date: "2023-06-13",
      process_date: "2023-06-13",
      rate: 0.141134,
      symbol: "ORPHY",
    },
  ],
  properties: {
    currency: { $ref: "#/components/schemas/currency" },
    cusip: { type: "string" },
    id: { $ref: "#/components/schemas/ca_id" },
    isin: { $ref: "#/components/schemas/isin" },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    process_date: { $ref: "#/components/schemas/process_date" },
    rate: { format: "double", type: "number" },
    symbol: { type: "string" },
  },
  required: ["id", "symbol", "cusip", "rate", "process_date"],
  type: "object",
};

export const region= {
  default: "us",
  description:
    "The region to filter corporate actions by.\n\n- `us`: only US corporate actions\n- `non_us`: only non-US corporate actions\n- `all`: both US and non-US corporate actions\n",
  enum: ["us", "non_us", "all"],
  type: "string",
};

export const reorganization= {
  description: "Reorganization (cash and/or multiple stock allocations).",
  properties: {
    cash_rate: { format: "double", type: "number" },
    currency: { $ref: "#/components/schemas/currency" },
    cusip: { type: "string" },
    effective_date: { $ref: "#/components/schemas/effective_date" },
    id: { $ref: "#/components/schemas/ca_id" },
    isin: { type: "string" },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    process_date: { $ref: "#/components/schemas/process_date" },
    stock_movements: {
      items: {
        $ref: "#/components/schemas/reorganization_stock_movement",
      },
      type: "array",
    },
    symbol: { type: "string" },
  },
  required: ["id", "symbol", "cusip", "process_date", "effective_date"],
  type: "object",
};

export const reorganization_stock_movement= {
  description: "A stock allocation leg in a reorganization.",
  properties: {
    cusip: { type: "string" },
    isin: { type: "string" },
    new_rate: { format: "double", type: "number" },
    source_rate: { format: "double", type: "number" },
    symbol: { type: "string" },
  },
  required: ["symbol", "cusip", "new_rate", "source_rate"],
  type: "object",
};

export const reverse_split= {
  description: "Reverse split.",
  examples: [
    {
      ex_date: "2023-08-24",
      id: "913de862-c02c-46dc-a89c-fc8779a50d30",
      new_cusip: "60879E200",
      new_rate: 1,
      old_cusip: "60879E101",
      old_rate: 50,
      process_date: "2023-08-24",
      record_date: "2023-08-24",
      symbol: "MNTS",
    },
  ],
  properties: {
    currency: { $ref: "#/components/schemas/currency" },
    ex_date: { $ref: "#/components/schemas/ex_date" },
    id: { $ref: "#/components/schemas/ca_id" },
    new_cusip: { type: "string" },
    new_isin: { $ref: "#/components/schemas/isin" },
    new_rate: { format: "double", type: "number" },
    new_symbol: {
      description:
        "The post-split ticker. Empty when the reverse split does not change the\nticker (the most common case); only populated when the issuer assigns a\ndifferent symbol after the split.\n",
      type: "string",
    },
    old_cusip: { type: "string" },
    old_isin: { $ref: "#/components/schemas/isin" },
    old_rate: { format: "double", type: "number" },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    process_date: { $ref: "#/components/schemas/process_date" },
    record_date: { $ref: "#/components/schemas/record_date" },
    symbol: { type: "string" },
  },
  required: [
    "id",
    "symbol",
    "old_cusip",
    "new_cusip",
    "new_rate",
    "old_rate",
    "process_date",
    "ex_date",
  ],
  type: "object",
};

export const rights_distribution= {
  description: "Rights distribution.",
  examples: [
    {
      ex_date: "2024-04-17",
      expiration_date: "2024-05-14",
      id: "69794cfd-0adc-4e11-9211-9210a9cf8932",
      new_cusip: "454089111",
      new_symbol: "IFN.RTWI",
      payable_date: "2024-04-19",
      process_date: "2024-04-19",
      rate: 1,
      record_date: "2024-04-18",
      source_cusip: "454089103",
      source_symbol: "IFN",
    },
  ],
  properties: {
    currency: { $ref: "#/components/schemas/currency" },
    ex_date: { $ref: "#/components/schemas/ex_date" },
    expiration_date: { $ref: "#/components/schemas/expiration_date" },
    id: { $ref: "#/components/schemas/ca_id" },
    new_cusip: { type: "string" },
    new_isin: { $ref: "#/components/schemas/isin" },
    new_symbol: { type: "string" },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    process_date: { $ref: "#/components/schemas/process_date" },
    rate: { format: "double", type: "number" },
    record_date: { $ref: "#/components/schemas/record_date" },
    source_cusip: { type: "string" },
    source_isin: { $ref: "#/components/schemas/isin" },
    source_symbol: { type: "string" },
  },
  required: [
    "id",
    "source_symbol",
    "source_cusip",
    "new_symbol",
    "new_cusip",
    "rate",
    "process_date",
    "ex_date",
    "payable_date",
  ],
  type: "object",
};

export const sort= {
  default: "asc",
  description: "Sort data in ascending or descending order.",
  enum: ["asc", "desc"],
  type: "string",
};

export const spin_off= {
  description: "Spin-off.",
  examples: [
    {
      ex_date: "2023-08-15",
      id: "82e602f6-35bc-4651-a5dd-f6d88ff37c55",
      new_cusip: "85237B101",
      new_rate: 1,
      new_symbol: "SRM",
      process_date: "2023-08-15",
      record_date: "2023-08-15",
      source_cusip: "48208F105",
      source_rate: 19.35,
      source_symbol: "JUPW",
    },
  ],
  properties: {
    currency: { $ref: "#/components/schemas/currency" },
    due_bill_redemption_date: {
      $ref: "#/components/schemas/due_bill_redemption_date",
    },
    ex_date: { $ref: "#/components/schemas/ex_date" },
    id: { $ref: "#/components/schemas/ca_id" },
    new_cusip: { type: "string" },
    new_isin: { $ref: "#/components/schemas/isin" },
    new_rate: { format: "double", type: "number" },
    new_symbol: { type: "string" },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    process_date: { $ref: "#/components/schemas/process_date" },
    record_date: { $ref: "#/components/schemas/record_date" },
    source_cusip: { type: "string" },
    source_isin: { $ref: "#/components/schemas/isin" },
    source_rate: { format: "double", type: "number" },
    source_symbol: { type: "string" },
  },
  required: [
    "id",
    "source_symbol",
    "source_cusip",
    "source_rate",
    "new_symbol",
    "new_cusip",
    "new_rate",
    "process_date",
    "ex_date",
  ],
  type: "object",
};

export const stock_and_cash_merger= {
  description: "Stock and cash merger.",
  examples: [
    {
      acquiree_cusip: "561409103",
      acquiree_rate: 1,
      acquiree_symbol: "MLVF",
      acquirer_cusip: "31931U102",
      acquirer_rate: 0.7733,
      acquirer_symbol: "FRBA",
      cash_rate: 7.8,
      effective_date: "2023-07-18",
      id: "e5248356-2c06-42cf-aeb9-1595bd616cdb",
      payable_date: "2023-07-18",
      process_date: "2023-07-18",
    },
  ],
  properties: {
    acquiree_cusip: { type: "string" },
    acquiree_isin: { $ref: "#/components/schemas/isin" },
    acquiree_rate: { format: "double", type: "number" },
    acquiree_symbol: { type: "string" },
    acquirer_cusip: { type: "string" },
    acquirer_isin: { $ref: "#/components/schemas/isin" },
    acquirer_rate: { format: "double", type: "number" },
    acquirer_symbol: { type: "string" },
    cash_rate: { format: "double", type: "number" },
    currency: { $ref: "#/components/schemas/currency" },
    effective_date: { $ref: "#/components/schemas/effective_date" },
    id: { $ref: "#/components/schemas/ca_id" },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    process_date: { $ref: "#/components/schemas/process_date" },
  },
  required: [
    "id",
    "acquirer_symbol",
    "acquirer_cusip",
    "acquirer_rate",
    "acquiree_symbol",
    "acquiree_cusip",
    "acquiree_rate",
    "cash_rate",
    "process_date",
    "effective_date",
  ],
  type: "object",
};

export const stock_auction= {
  description: "An auction\n",
  examples: [
    {
      c: "O",
      p: 135,
      t: "2022-10-13T13:30:01.688322951Z",
      x: "Q",
    },
  ],
  properties: {
    c: {
      description:
        "The condition flag indicating that this is an auction. See `v2/stocks/meta/conditions/trade` for more details.\n",
      type: "string",
    },
    p: {
      description: "Auction price.",
      format: "double",
      type: "number",
    },
    s: {
      description: "Auction trade size.",
      format: "int64",
      type: "integer",
    },
    t: { $ref: "#/components/schemas/timestamp" },
    x: {
      description:
        "Exchange code. See `v2/stocks/meta/exchanges` for more details.",
      type: "string",
    },
  },
  required: ["t", "x", "p", "c"],
  type: "object",
};

export const stock_auction_feed= { default: "sip", type: "string" };

export const stock_auctions_resp= {
  properties: {
    auctions: {
      additionalProperties: {
        items: { $ref: "#/components/schemas/stock_daily_auctions" },
        type: "array",
      },
      type: "object",
    },
    currency: { type: "string" },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
  },
  required: ["auctions", "next_page_token"],
  type: "object",
};

export const stock_auctions_resp_single= {
  properties: {
    auctions: {
      items: { $ref: "#/components/schemas/stock_daily_auctions" },
      type: "array",
    },
    currency: { type: "string" },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
    symbol: { type: "string" },
  },
  required: ["auctions", "next_page_token", "symbol"],
  type: "object",
};

export const stock_bar= {
  description: "OHLC aggregate of all the trades in a given interval.\n",
  examples: [
    {
      c: 178.08,
      h: 178.34,
      l: 177.76,
      n: 1727,
      o: 178.26,
      t: "2022-01-03T09:00:00Z",
      v: 60937,
      vw: 177.954244,
    },
  ],
  properties: {
    c: {
      description: "Closing price.",
      format: "double",
      type: "number",
    },
    h: {
      description: "High price.",
      format: "double",
      type: "number",
    },
    l: {
      description: "Low price.",
      format: "double",
      type: "number",
    },
    n: {
      description: "Trade count in the bar.",
      format: "int64",
      type: "integer",
    },
    o: {
      description: "Opening price.",
      format: "double",
      type: "number",
    },
    t: { $ref: "#/components/schemas/timestamp" },
    v: {
      description: "Bar volume.",
      format: "int64",
      type: "integer",
    },
    vw: {
      description: "Volume weighted average price.",
      format: "double",
      type: "number",
    },
  },
  required: ["t", "o", "h", "l", "c", "v", "n", "vw"],
  type: "object",
};

export const stock_bars_resp= {
  properties: {
    bars: {
      additionalProperties: {
        items: { $ref: "#/components/schemas/stock_bar" },
        type: "array",
      },
      type: "object",
    },
    currency: { type: "string" },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
  },
  required: ["bars", "next_page_token"],
  type: "object",
};

export const stock_bars_resp_single= {
  properties: {
    bars: {
      items: { $ref: "#/components/schemas/stock_bar" },
      type: "array",
    },
    currency: { type: "string" },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
    symbol: { type: "string" },
  },
  required: ["bars", "next_page_token", "symbol"],
  type: "object",
};

export const stock_conditions= {
  additionalProperties: { type: "string" },
  examples: [{ "@": "Regular Sale", A: "Acquisition", B: "Bunched Trade" }],
  type: "object",
};

export const stock_daily_auctions= {
  description: "Opening and closing auction prices for a given day.\n",
  properties: {
    c: {
      description:
        "Closing auctions. Every price / exchange / condition triplet is only shown once, with its earliest timestamp.",
      items: { $ref: "#/components/schemas/stock_auction" },
      type: "array",
    },
    d: { $ref: "#/components/schemas/date" },
    o: {
      description: "Opening auctions.",
      items: { $ref: "#/components/schemas/stock_auction" },
      type: "array",
    },
  },
  required: ["d", "o", "c"],
  type: "object",
};

export const stock_dividend= {
  description: "Stock dividend.",
  examples: [
    {
      cusip: "605015106",
      ex_date: "2023-05-19",
      id: "3ae94c30-2d37-473a-bf29-5f7b4ab6d3ca",
      payable_date: "2023-05-05",
      process_date: "2023-05-19",
      rate: 0.05,
      record_date: "2023-05-22",
      symbol: "MSBC",
    },
  ],
  properties: {
    currency: { $ref: "#/components/schemas/currency" },
    cusip: { type: "string" },
    ex_date: { $ref: "#/components/schemas/ex_date" },
    id: { $ref: "#/components/schemas/ca_id" },
    isin: { $ref: "#/components/schemas/isin" },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    process_date: { $ref: "#/components/schemas/process_date" },
    rate: { format: "double", type: "number" },
    record_date: { $ref: "#/components/schemas/record_date" },
    symbol: { type: "string" },
  },
  required: ["id", "symbol", "cusip", "rate", "process_date", "ex_date"],
  type: "object",
};

export const stock_exchanges= {
  additionalProperties: { type: "string" },
  examples: [{ N: "New York Stock Exchange", V: "IEX" }],
  type: "object",
};

export const stock_historical_feed= {
  default: "sip",
  enum: ["iex", "otc", "sip", "boats"],
  type: "string",
};

export const stock_latest_bars_resp= {
  properties: {
    bars: {
      additionalProperties: {
        $ref: "#/components/schemas/stock_bar",
      },
      type: "object",
    },
    currency: { type: "string" },
  },
  required: ["bars"],
  type: "object",
};

export const stock_latest_bars_resp_single= {
  properties: {
    bar: { $ref: "#/components/schemas/stock_bar" },
    currency: { type: "string" },
    symbol: { type: "string" },
  },
  required: ["bar", "symbol"],
  type: "object",
};

export const stock_latest_feed= {
  enum: ["delayed_sip", "iex", "otc", "sip", "boats", "overnight"],
  type: "string",
};

export const stock_latest_quotes_resp= {
  properties: {
    currency: { type: "string" },
    quotes: {
      additionalProperties: {
        $ref: "#/components/schemas/stock_quote",
      },
      type: "object",
    },
  },
  required: ["quotes"],
  type: "object",
};

export const stock_latest_quotes_resp_single= {
  properties: {
    currency: { type: "string" },
    quote: { $ref: "#/components/schemas/stock_quote" },
    symbol: { type: "string" },
  },
  required: ["quote", "symbol"],
  type: "object",
};

export const stock_latest_trades_resp= {
  properties: {
    currency: { type: "string" },
    trades: {
      additionalProperties: {
        $ref: "#/components/schemas/stock_trade",
      },
      type: "object",
    },
  },
  required: ["trades"],
  type: "object",
};

export const stock_latest_trades_resp_single= {
  properties: {
    currency: { type: "string" },
    symbol: { type: "string" },
    trade: { $ref: "#/components/schemas/stock_trade" },
  },
  required: ["trade", "symbol"],
  type: "object",
};

export const stock_merger= {
  description: "Stock merger.",
  examples: [
    {
      acquiree_cusip: "53223X107",
      acquiree_rate: 1,
      acquiree_symbol: "LSI",
      acquirer_cusip: "30225T102",
      acquirer_rate: 0.895,
      acquirer_symbol: "EXR",
      effective_date: "2023-07-20",
      id: "728f8cb2-a00e-4bc7-ad14-d15fe82bbcff",
      payable_date: "2023-07-20",
      process_date: "2023-07-20",
    },
  ],
  properties: {
    acquiree_cusip: { type: "string" },
    acquiree_isin: { $ref: "#/components/schemas/isin" },
    acquiree_rate: { format: "double", type: "number" },
    acquiree_symbol: { type: "string" },
    acquirer_cusip: { type: "string" },
    acquirer_isin: { $ref: "#/components/schemas/isin" },
    acquirer_rate: { format: "double", type: "number" },
    acquirer_symbol: { type: "string" },
    currency: { $ref: "#/components/schemas/currency" },
    effective_date: { $ref: "#/components/schemas/effective_date" },
    id: { $ref: "#/components/schemas/ca_id" },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    process_date: { $ref: "#/components/schemas/process_date" },
  },
  required: [
    "id",
    "acquirer_symbol",
    "acquirer_cusip",
    "acquirer_rate",
    "acquiree_symbol",
    "acquiree_cusip",
    "acquiree_rate",
    "process_date",
    "effective_date",
  ],
  type: "object",
};

export const stock_quote= {
  description: "The best bid and ask information for a given security.",
  examples: [
    {
      ap: 387.7,
      as: 1,
      ax: "C",
      bp: 387.67,
      bs: 1,
      bx: "N",
      c: ["R"],
      t: "2021-02-06T13:35:08.946977536Z",
      z: "C",
    },
  ],
  properties: {
    ap: {
      description: "Ask price. 0 means the security has no active ask.",
      format: "double",
      type: "number",
    },
    as: {
      description:
        "Ask size in shares (round lots prior to November 3, 2025).",
      format: "uint32",
      type: "integer",
    },
    ax: {
      description:
        "Ask exchange. See `v2/stocks/meta/exchanges` for more details.",
      type: "string",
    },
    bp: {
      description: "Bid price. 0 means the security has no active bid.",
      format: "double",
      type: "number",
    },
    bs: {
      description:
        "Bid size in shares (round lots prior to November 3, 2025).",
      format: "uint32",
      type: "integer",
    },
    bx: {
      description:
        "Bid exchange. See `v2/stocks/meta/exchanges` for more details.",
      type: "string",
    },
    c: {
      description:
        "Condition flags. See `v2/stocks/meta/conditions/quote` for more details. If the array contains one flag, it applies to both the bid and ask. If the array contains two flags, the first one applies to the bid and the second one to the ask.\n",
      items: { type: "string" },
      type: "array",
    },
    t: { $ref: "#/components/schemas/timestamp" },
    z: { $ref: "#/components/schemas/stock_tape" },
  },
  required: ["t", "bx", "bp", "bs", "ap", "as", "ax", "c", "z"],
  type: "object",
};

export const stock_quotes_resp= {
  properties: {
    currency: { type: "string" },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
    quotes: {
      additionalProperties: {
        items: { $ref: "#/components/schemas/stock_quote" },
        type: "array",
      },
      type: "object",
    },
  },
  required: ["quotes", "next_page_token"],
  type: "object",
};

export const stock_quotes_resp_single= {
  properties: {
    currency: { type: "string" },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
    quotes: {
      items: { $ref: "#/components/schemas/stock_quote" },
      type: "array",
    },
    symbol: { type: "string" },
  },
  required: ["quotes", "next_page_token", "symbol"],
  type: "object",
};

export const stock_snapshot= {
  description:
    "A snapshot provides the latest trade, latest quote, latest minute bar, current daily bar and previous daily bar.\n",
  properties: {
    dailyBar: { $ref: "#/components/schemas/stock_bar" },
    latestQuote: { $ref: "#/components/schemas/stock_quote" },
    latestTrade: { $ref: "#/components/schemas/stock_trade" },
    minuteBar: { $ref: "#/components/schemas/stock_bar" },
    prevDailyBar: { $ref: "#/components/schemas/stock_bar" },
  },
  type: "object",
};

export const stock_snapshots_resp= {
  additionalProperties: {
    $ref: "#/components/schemas/stock_snapshot",
  },
  type: "object",
};

export const stock_snapshots_resp_single= {
  allOf: [
    {
      properties: {
        currency: { type: "string" },
        symbol: { type: "string" },
      },
      type: "object",
    },
    { $ref: "#/components/schemas/stock_snapshot" },
  ],
};

export const stock_tape= {
  description:
    "- A: New York Stock Exchange\n- B: NYSE Arca, Bats, IEX and other regional exchanges\n- C: NASDAQ\n- N: Overnight\n- O: OTC\n",
  enum: ["A", "B", "C", "N", "O"],
  type: "string",
};

export const stock_trade= {
  description: "A stock trade.",
  examples: [
    {
      c: ["@", "T"],
      i: 1,
      p: 178.26,
      s: 246,
      t: "2022-01-03T09:00:00.086175744Z",
      x: "P",
      z: "C",
    },
  ],
  properties: {
    c: {
      description:
        "Condition flags. See `v2/stocks/meta/conditions/trade` for more details.",
      items: { type: "string" },
      type: "array",
    },
    i: {
      description: "Trade ID sent by the exchange.",
      format: "uint64",
      type: "integer",
    },
    p: {
      description: "Trade price.",
      format: "double",
      type: "number",
    },
    s: {
      description: "Trade size.",
      format: "uint32",
      type: "integer",
    },
    t: { $ref: "#/components/schemas/timestamp" },
    u: {
      description:
        "Update to the trade. This field is optional, if it's missing, the trade is valid. Otherwise, it can have these values:\n - canceled: indicates that the trade has been canceled\n - incorrect: indicates that the trade has been corrected and the given trade is no longer valid\n - corrected: indicates that this trade is the correction of a previous (incorrect) trade\n",
      type: "string",
    },
    x: {
      description:
        "Exchange code. See `v2/stocks/meta/exchanges` for more details.",
      type: "string",
    },
    z: { $ref: "#/components/schemas/stock_tape" },
  },
  required: ["t", "i", "x", "p", "s", "c", "z"],
  type: "object",
};

export const stock_trades_resp= {
  properties: {
    currency: { type: "string" },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
    trades: {
      additionalProperties: {
        items: { $ref: "#/components/schemas/stock_trade" },
        type: "array",
      },
      type: "object",
    },
  },
  required: ["trades", "next_page_token"],
  type: "object",
};

export const stock_trades_resp_single= {
  properties: {
    currency: { type: "string" },
    next_page_token: { $ref: "#/components/schemas/next_page_token" },
    symbol: { type: "string" },
    trades: {
      items: { $ref: "#/components/schemas/stock_trade" },
      type: "array",
    },
  },
  required: ["trades", "next_page_token", "symbol"],
  type: "object",
};

export const timestamp= {
  description: "Timestamp in RFC-3339 format with nanosecond precision.",
  format: "date-time",
  type: "string",
};

export const unit_split= {
  description: "Unit split.",
  examples: [
    {
      alternate_cusip: "G5391L110",
      alternate_rate: 0.3333,
      alternate_symbol: "LVROW",
      effective_date: "2023-03-01",
      id: "3e68e87e-ae95-4d68-91d1-715d52ef143a",
      new_cusip: "G5391L102",
      new_rate: 1,
      new_symbol: "LVRO",
      old_cusip: "G8990L119",
      old_rate: 1,
      old_symbol: "TPBAU",
      process_date: "2023-03-01",
    },
  ],
  properties: {
    alternate_cusip: { type: "string" },
    alternate_isin: { $ref: "#/components/schemas/isin" },
    alternate_rate: { format: "double", type: "number" },
    alternate_symbol: { type: "string" },
    currency: { $ref: "#/components/schemas/currency" },
    effective_date: { $ref: "#/components/schemas/effective_date" },
    id: { $ref: "#/components/schemas/ca_id" },
    new_cusip: { type: "string" },
    new_isin: { $ref: "#/components/schemas/isin" },
    new_rate: { format: "double", type: "number" },
    new_symbol: { type: "string" },
    old_cusip: { type: "string" },
    old_isin: { $ref: "#/components/schemas/isin" },
    old_rate: { format: "double", type: "number" },
    old_symbol: { type: "string" },
    payable_date: { $ref: "#/components/schemas/payable_date" },
    process_date: { $ref: "#/components/schemas/process_date" },
  },
  required: [
    "id",
    "old_symbol",
    "old_cusip",
    "old_rate",
    "new_symbol",
    "new_cusip",
    "new_rate",
    "alternate_symbol",
    "alternate_cusip",
    "alternate_rate",
    "process_date",
    "effective_date",
  ],
  type: "object",
};

export const worthless_removal= {
  description: "Worthless removal.",
  examples: [
    {
      cusip: "078771300",
      id: "106c2149-ee04-4d2e-a943-98dbb4d21a3c",
      process_date: "2024-12-19",
      symbol: "BLPH",
    },
  ],
  properties: {
    currency: { $ref: "#/components/schemas/currency" },
    cusip: { type: "string" },
    id: { $ref: "#/components/schemas/ca_id" },
    isin: { $ref: "#/components/schemas/isin" },
    process_date: { $ref: "#/components/schemas/process_date" },
    symbol: { type: "string" },
  },
  required: ["id", "symbol", "cusip", "process_date"],
  type: "object",
};

