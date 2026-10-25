import type {
  Evaluation,
  FocusRegion,
  Question,
  Report,
  Rung,
} from "@/lib/types";

export type SeedProbe = {
  prompt: string;
  answer: string;
  evaluation: Evaluation;
};

export type SeedTurn = {
  questionId: string;
  questionIndex: number;
  answer: string;
  inputMode: "flow";
  evaluation: Evaluation;
  probe?: SeedProbe;
};

export type Seed = {
  id: string;
  title: string;
  subtitle: string;
  band: Report["band"];
  language: string;
  filePath: string;
  repoLabel: string;
  code: string;
  summary: string;
  focusRegions: FocusRegion[];
  questions: Question[];
  turns: SeedTurn[];
  report: Report;
};

function ev(overrides: Partial<Evaluation>): Evaluation {
  return {
    verdict: "partial",
    correctness: 2,
    depth: 2,
    ownership: 2,
    clarity: 3,
    confidence: 3,
    quote: "",
    quoteIsStrength: false,
    missing: [],
    followUp: null,
    followUpReason: null,
    ...overrides,
  };
}

function question(
  id: string,
  index: number,
  rung: Rung,
  prompt: string,
  focusStart: number,
  focusEnd: number,
  expectedPoints: string[],
  redFlags: string[],
  whyThisQuestion: string,
): Question {
  return {
    id,
    index,
    rung,
    prompt,
    focusStart,
    focusEnd,
    expectedPoints,
    redFlags,
    whyThisQuestion,
  };
}

const debounceCode = `import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}`;

const debounceQuestions: Question[] = [
  question(
    "debounce-q1",
    0,
    "comprehension",
    "In two minutes or less: what does this hook promise its caller, and what does it deliberately not do?",
    1,
    15,
    [
      "delays updates until the value has been quiet for delay",
      "returns the last settled value",
      "does not cancel the caller's work",
    ],
    [
      "says it throttles instead of debounces",
      "claims it prevents all re-renders",
      "describes the API without naming the timing behavior",
    ],
    "Tests whether the candidate can state the contract before the implementation.",
  ),
  question(
    "debounce-q2",
    1,
    "decision",
    "Why is the settled value in useState instead of a ref, and why does the timer live in an effect?",
    3,
    12,
    [
      "state is required to trigger a re-render",
      "a ref would update without notifying React",
      "the effect resets when value or delay changes",
      "the cleanup cancels the previous timer",
    ],
    [
      "says refs are always faster without naming the update problem",
      "claims the effect is only for cleanup",
    ],
    "Targets the central React decision: state for visible output, effect for synchronization.",
  ),
  question(
    "debounce-q3",
    2,
    "failure",
    "What happens if delay changes on every render? Walk me through the timer, not the hook's API.",
    6,
    12,
    [
      "the effect tears down and restarts",
      "the cleanup clears the old timer",
      "an unstable delay can starve the settled update",
    ],
    [
      "says it throws",
      "says it is a syntax error",
      "only says to memoize without explaining the timer",
    ],
    "Follows the failure boundary where a dependency change can prevent the timer from firing.",
  ),
  question(
    "debounce-q4",
    3,
    "change",
    "Add a maxWait option so the value settles at least every two seconds during continuous typing. What changes, and what new failure does it introduce?",
    10,
    14,
    [
      "a second timer for maxWait",
      "a ref for the first-change timestamp",
      "cleanup clears both timers",
      "the timers can race on the same update",
    ],
    [
      "says to use a library and stops",
      "adds maxWait without touching cleanup",
      "ignores the unmount case",
    ],
    "Tests whether the candidate can extend the design without breaking its lifecycle.",
  ),
  question(
    "debounce-q5",
    4,
    "ownership",
    "Line 11 returns clearTimeout(id). Why is that line there, and what breaks if we delete it?",
    11,
    11,
    [
      "cancels the previous timer",
      "prevents stale updates",
      "avoids timers left behind after unmount",
    ],
    [
      "says it is just a cleanup convention",
      "claims React cancels timers automatically",
    ],
    "One line, one consequence: the ownership rung should be answerable without hand-waving.",
  ),
];

const debounceTurns: SeedTurn[] = [
  {
    questionId: "debounce-q1",
    questionIndex: 0,
    inputMode: "flow",
    answer:
      "It takes a fast-changing value and returns a copy that only updates after the input has been quiet for `delay` milliseconds. It’s for search boxes and filters. It deliberately doesn’t cancel the caller’s work; it just delays the value the caller sees.",
    evaluation: ev({
      verdict: "strong",
      correctness: 4,
      depth: 3,
      ownership: 3,
      clarity: 4,
      confidence: 3,
      quote: "returns a copy that only updates after the input has been quiet",
      quoteIsStrength: true,
    }),
  },
  {
    questionId: "debounce-q2",
    questionIndex: 1,
    inputMode: "flow",
    answer:
      "The debounced value has to trigger a re-render when it changes, so it belongs in state. A ref would update silently and the component would keep rendering the old value. The effect owns the timer because it has to reset whenever `value` or `delay` changes; the cleanup cancels the previous timer.",
    evaluation: ev({
      verdict: "strong",
      correctness: 4,
      depth: 3,
      ownership: 3,
      clarity: 4,
      confidence: 3,
      quote:
        "A ref would update silently and the component would keep rendering the old value",
      quoteIsStrength: true,
    }),
  },
  {
    questionId: "debounce-q3",
    questionIndex: 2,
    inputMode: "flow",
    answer:
      "The effect depends on `delay`, so it tears down and restarts the timer every time `delay` changes. If the parent passes a new `delay` on every render, the timer never gets to fire. I’d probably memoize it, or just not pass an unstable value.",
    evaluation: ev({
      verdict: "partial",
      correctness: 2,
      depth: 2,
      ownership: 2,
      clarity: 3,
      confidence: 3,
      quote: "I’d probably memoize it, or just not pass an unstable value",
      missing: [
        "the cleanup clears the old timer",
        "an unstable delay can starve the settled update",
      ],
      followUp:
        "You said you’d probably memoize it. What exactly resets at line 12 when `delay` changes, and what does the user see if it changes on every keystroke?",
      followUpReason: "Targets the missing timer lifecycle, not the API.",
    }),
    probe: {
      prompt:
        "You said you’d probably memoize it. What exactly resets at line 12 when `delay` changes, and what does the user see if it changes on every keystroke?",
      answer:
        "The cleanup clears the old timeout, then the effect schedules a new one with the new delay. If it changes every keystroke, the user never sees a settled value; the search never fires.",
      evaluation: ev({
        verdict: "strong",
        correctness: 3,
        depth: 2,
        ownership: 2,
        clarity: 3,
        confidence: 3,
        quote: "the user never sees a settled value; the search never fires",
        quoteIsStrength: true,
      }),
    },
  },
  {
    questionId: "debounce-q4",
    questionIndex: 3,
    inputMode: "flow",
    answer:
      "You need a second timer that tracks the first change and fires after `maxWait`, plus a ref for the timestamp. The cleanup has to clear both timers. The new failure is a maxWait firing after unmount if the cleanup misses it, and the two timers racing on the same state update.",
    evaluation: ev({
      verdict: "strong",
      correctness: 3,
      depth: 3,
      ownership: 3,
      clarity: 3,
      confidence: 3,
      quote: "the two timers racing on the same state update",
      quoteIsStrength: true,
    }),
  },
  {
    questionId: "debounce-q5",
    questionIndex: 4,
    inputMode: "flow",
    answer:
      "It cancels the previous timer when the value or delay changes. Without it, every keystroke would schedule another update, and the old timers would still fire. You’d get a burst of stale values instead of one, plus timers left behind after unmount.",
    evaluation: ev({
      verdict: "strong",
      correctness: 3,
      depth: 3,
      ownership: 3,
      clarity: 3,
      confidence: 3,
      quote: "You’d get a burst of stale values instead of one",
      quoteIsStrength: true,
    }),
  },
];

const debounceReport: Report = {
  band: "almost",
  headline: "Strong on the mechanics. One gap: unstable inputs can starve the timer.",
  summary:
    "Across six graded turns, correctness was the strongest signal (3.2/4); depth and ownership were the clearest gaps (2.7/4). At question 3, the answer stayed at the API level — “I’d probably memoize it” — and never described the cleanup-and-reschedule loop that an unstable `delay` triggers. The final ownership answer was precise, which is why this reads as a near-miss rather than a fail.",
  axes: [
    {
      key: "correctness",
      label: "Correctness",
      score: 3.2,
      evidenceQuote:
        "returns a copy that only updates after the input has been quiet",
      line: 3,
      note: "The contract and the state/effect split were both right.",
    },
    {
      key: "depth",
      label: "Depth",
      score: 2.7,
      evidenceQuote:
        "I’d probably memoize it, or just not pass an unstable value",
      line: 6,
      note: "The cleanup-and-reschedule loop was the missing link.",
    },
    {
      key: "ownership",
      label: "Ownership",
      score: 2.7,
      evidenceQuote: "You’d get a burst of stale values instead of one",
      line: 11,
      note: "Strong at the end; the middle answers described the API more than the mechanism.",
    },
    {
      key: "clarity",
      label: "Clarity",
      score: 3.3,
      evidenceQuote:
        "The effect owns the timer because it has to reset whenever `value` or `delay` changes",
      line: 6,
      note: "The reasoning was easy to follow, even when it was incomplete.",
    },
  ],
  confidentButWrong: null,
  quietlyRight: null,
  bestMoment: {
    questionIndex: 4,
    quote: "You’d get a burst of stale values instead of one",
  },
  nextQuestions: [
    "What would you test first to prove the cleanup runs before the next timer?",
    "How would maxWait interact with a delay that changes mid-window?",
    "Where would you put the maxWait timestamp so a re-render doesn’t reset it?",
  ],
  createdAt: "2026-10-20T10:24:00.000Z",
};

const authCode = `const jwt = require("jsonwebtoken");
const { getUser } = require("./users");

module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await getUser(payload.sub);

    if (!req.user) {
      return res.status(401).json({ error: "unknown_user" });
    }

    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "token_expired" });
    }

    return res.status(401).json({ error: "invalid_token" });
  }
};`;

const authQuestions: Question[] = [
  question(
    "auth-q1",
    0,
    "comprehension",
    "What does this middleware guarantee to the routes behind it, and what does it not guarantee?",
    1,
    30,
    [
      "a valid Bearer token gets req.user",
      "missing, expired, invalid, or unknown-user tokens get a 401",
      "role or permission checks are still the route's job",
    ],
    [
      "says it guarantees authorization",
      "claims it validates the user's permissions",
      "ignores the unknown-user branch",
    ],
    "Separates authentication from authorization before the failure questions.",
  ),
  question(
    "auth-q2",
    1,
    "decision",
    "Why verify the token in middleware instead of inside each protected route? What does that choice cost?",
    3,
    17,
    [
      "one consistent check and set of error codes",
      "handlers can assume req.user exists",
      "every mounted route pays for verification and a user lookup",
      "per-route authorization is still required",
    ],
    [
      "says middleware is always faster",
      "ignores the cost on public routes",
    ],
    "Makes the candidate defend a structural choice, not just describe it.",
  ),
  question(
    "auth-q3",
    2,
    "failure",
    "The database behind getUser goes down and throws. What does the client receive, and what does the on-call engineer see?",
    17,
    28,
    [
      "the catch returns invalid_token",
      "the client gets a 401 instead of a 5xx",
      "the outage is hidden from the client and monitoring",
      "a valid session may be discarded",
    ],
    [
      "says a 401 is correct because the user is not authenticated",
      "ignores the difference between auth failure and infrastructure failure",
    ],
    "The central failure question: does the candidate notice that the catch conflates two different failures?",
  ),
  question(
    "auth-q4",
    3,
    "change",
    "Add refresh-token rotation. What changes in this file, and what stays the same?",
    22,
    30,
    [
      "the access token is still verified here",
      "a refresh endpoint and refresh token are added",
      "rotation and reuse detection are required",
      "the expired path triggers a refresh",
    ],
    [
      "puts refresh tokens in localStorage",
      "adds rotation without reuse detection",
      "changes the middleware into a session store",
    ],
    "Tests whether the candidate can extend auth without turning middleware into a monolith.",
  ),
  question(
    "auth-q5",
    4,
    "ownership",
    "Line 24 special-cases TokenExpiredError. Why, and what does the client do differently with token_expired?",
    24,
    27,
    [
      "expiry is recoverable",
      "the client can refresh instead of logging out",
      "invalid or missing tokens are not recoverable",
      "collapsing the errors logs everyone out on normal expiry",
    ],
    [
      "says the special case is only for logging",
      "claims the client treats all 401s the same",
    ],
    "One branch, one client consequence: the ownership rung should connect code to behavior.",
  ),
];

const authTurns: SeedTurn[] = [
  {
    questionId: "auth-q1",
    questionIndex: 0,
    inputMode: "flow",
    answer:
      "It guarantees that a request with a valid Bearer token gets a `req.user`, and that missing, expired, invalid, or unknown-user tokens get a 401. It doesn’t guarantee authorization; a route still has to check whether that user can do the thing.",
    evaluation: ev({
      verdict: "strong",
      correctness: 4,
      depth: 3,
      ownership: 3,
      clarity: 4,
      confidence: 4,
      quote:
        "It doesn’t guarantee authorization; a route still has to check whether that user can do the thing",
      quoteIsStrength: true,
    }),
  },
  {
    questionId: "auth-q2",
    questionIndex: 1,
    inputMode: "flow",
    answer:
      "Centralizing it means every protected route gets the same check and the same error codes, and handlers can assume `req.user` exists. The cost is that any route you mount it on pays for a JWT verification and a user lookup, even if the route is public. You also still need per-route authorization.",
    evaluation: ev({
      verdict: "strong",
      correctness: 4,
      depth: 3,
      ownership: 3,
      clarity: 4,
      confidence: 4,
      quote:
        "any route you mount it on pays for a JWT verification and a user lookup",
      quoteIsStrength: true,
    }),
  },
  {
    questionId: "auth-q3",
    questionIndex: 2,
    inputMode: "flow",
    answer:
      "The catch catches it and returns `invalid_token`. That’s correct because we couldn’t authenticate the user, so a 401 is the right response. The client can retry.",
    evaluation: ev({
      verdict: "weak",
      correctness: 1,
      depth: 1,
      ownership: 1,
      clarity: 3,
      confidence: 4,
      quote:
        "That’s correct because we couldn’t authenticate the user, so a 401 is the right response",
      missing: [
        "a database outage is a 5xx/incident, not an auth failure",
        "the catch conflates infrastructure and token errors",
        "the client may discard a valid session",
      ],
      followUp:
        "You said a 401 is the right response when the database is down. What does the client do with a 401 at line 28, and what does the on-call engineer see?",
      followUpReason:
        "Tests the consequence of conflating authentication with infrastructure.",
    }),
    probe: {
      prompt:
        "You said a 401 is the right response when the database is down. What does the client do with a 401 at line 28, and what does the on-call engineer see?",
      answer:
        "The client would probably log the user out or send them to login. The on-call engineer sees `invalid_token`, not a database error. I guess that’s misleading.",
      evaluation: ev({
        verdict: "partial",
        correctness: 2,
        depth: 2,
        ownership: 2,
        clarity: 3,
        confidence: 2,
        quote:
          "The on-call engineer sees `invalid_token`, not a database error",
        missing: [
          "the outage is hidden from monitoring",
          "a 503 would let the client retry without discarding the session",
        ],
      }),
    },
  },
  {
    questionId: "auth-q4",
    questionIndex: 3,
    inputMode: "flow",
    answer:
      "You need a refresh endpoint and a refresh token, probably in an httpOnly cookie. The access token still gets verified here. When it expires, the client calls refresh, gets a new pair, and retries. You need rotation and reuse detection so a stolen refresh token can’t be replayed.",
    evaluation: ev({
      verdict: "strong",
      correctness: 3,
      depth: 3,
      ownership: 3,
      clarity: 3,
      confidence: 3,
      quote:
        "You need rotation and reuse detection so a stolen refresh token can’t be replayed",
      quoteIsStrength: true,
    }),
  },
  {
    questionId: "auth-q5",
    questionIndex: 4,
    inputMode: "flow",
    answer:
      "Expired is recoverable; the client can refresh. Invalid or missing is not. The client uses the error code to decide whether to call refresh or send the user to login. If we collapsed them, the client would log everyone out on a normal expiry.",
    evaluation: ev({
      verdict: "strong",
      correctness: 4,
      depth: 3,
      ownership: 4,
      clarity: 4,
      confidence: 3,
      quote:
        "If we collapsed them, the client would log everyone out on a normal expiry",
      quoteIsStrength: true,
    }),
  },
];

const authReport: Report = {
  band: "almost",
  headline: "Sounds certain on the happy path. Can’t defend the failure path.",
  summary:
    "Across six graded turns, clarity was the strongest signal (3.5/4); depth was the clearest gap (2.5/4). At question 3, the answer was confident — “That’s correct because we couldn’t authenticate the user” — but a database outage is not an authentication failure. The catch turns an infrastructure incident into a 401 and hides it from both the client and the on-call engineer. The final ownership answer on expiry shows the candidate can make the distinction when the code forces it.",
  axes: [
    {
      key: "correctness",
      label: "Correctness",
      score: 3,
      evidenceQuote:
        "It doesn’t guarantee authorization; a route still has to check whether that user can do the thing",
      line: 4,
      note: "Authentication and authorization were separated correctly.",
    },
    {
      key: "depth",
      label: "Depth",
      score: 2.5,
      evidenceQuote:
        "That’s correct because we couldn’t authenticate the user, so a 401 is the right response",
      line: 17,
      note: "A database outage is a 5xx/incident, not an auth failure.",
    },
    {
      key: "ownership",
      label: "Ownership",
      score: 2.7,
      evidenceQuote:
        "If we collapsed them, the client would log everyone out on a normal expiry",
      line: 24,
      note: "The expiry branch was defended well; the catch was not.",
    },
    {
      key: "clarity",
      label: "Clarity",
      score: 3.5,
      evidenceQuote:
        "Centralizing it means every protected route gets the same check and the same error codes",
      line: 8,
      note: "The reasoning was structured and easy to follow.",
    },
  ],
  confidentButWrong: {
    questionIndex: 2,
    quote:
      "That’s correct because we couldn’t authenticate the user, so a 401 is the right response",
    why: "A database outage is a 5xx/incident, not an auth failure.",
  },
  quietlyRight: null,
  bestMoment: {
    questionIndex: 4,
    quote:
      "If we collapsed them, the client would log everyone out on a normal expiry",
  },
  nextQuestions: [
    "What status code should a database outage return, and what should the client do with it?",
    "How would you separate auth failures from infrastructure failures in logs and metrics?",
    "Where would refresh-token rotation live, and what happens on refresh-token reuse?",
  ],
  createdAt: "2026-10-21T15:42:00.000Z",
};

const csvCode = `import csv
import time
import psycopg2


def ingest(path, conn):
    inserted = 0

    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        with conn.cursor() as cur:
            for row in reader:
                try:
                    cur.execute(
                        "insert into events (id, kind, amount) "
                        "values (%s, %s, %s) "
                        "on conflict (id) do nothing",
                        (row["id"], row["kind"], row["amount"]),
                    )
                    inserted += 1
                except psycopg2.Error as e:
                    print("failed", row["id"], e)
                    time.sleep(1)

            conn.commit()

    return inserted`;

const csvQuestions: Question[] = [
  question(
    "csv-q1",
    0,
    "comprehension",
    "What does this function promise the caller, and what does the return value actually count?",
    1,
    27,
    [
      "reads a CSV and upserts rows",
      "counts attempted inserts, not committed rows",
      "commits once at the end",
    ],
    [
      "says it counts committed rows",
      "misses the single commit",
      "describes the CSV reader but not the database effect",
    ],
    "Starts with the gap between the function's contract and its counter.",
  ),
  question(
    "csv-q2",
    1,
    "decision",
    "Why on conflict do nothing instead of an update? What does that choice cost you if the source corrects a row?",
    13,
    20,
    [
      "re-running is idempotent",
      "existing events are not overwritten",
      "source corrections are ignored",
      "an update or version column would be needed for corrections",
    ],
    [
      "says the conflict clause is only for performance",
      "ignores the correction case",
    ],
    "Tests the trade-off behind an idempotent import.",
  ),
  question(
    "csv-q3",
    2,
    "failure",
    "The connection drops halfway through the file. What happens to the rows, to inserted, and to a retry?",
    9,
    25,
    [
      "the transaction rolls back",
      "inserted overcounts rows that were not committed",
      "a retry is idempotent because of the conflict clause",
      "all progress is lost",
    ],
    [
      "says the rows are committed one by one",
      "misses the counter mismatch",
      "claims a retry duplicates rows",
    ],
    "Joins the transaction boundary to the counter and the retry story.",
  ),
  question(
    "csv-q4",
    3,
    "change",
    "Ingest ten million rows with this function. What changes first, and what stays the same?",
    9,
    23,
    [
      "one transaction is too large",
      "row-by-row execution is too slow",
      "COPY into a staging table, then insert-select",
      "batch commits and progress",
      "capped backoff instead of sleep",
    ],
    [
      "only says to add more indexes",
      "suggests loading everything into memory",
      "keeps one commit for ten million rows",
    ],
    "Forces a concrete scaling decision with a visible cost.",
  ),
  question(
    "csv-q5",
    4,
    "ownership",
    "Line 23 sleeps for a second inside the exception. Why is it there, and what does it do to a ten-million-row import?",
    21,
    23,
    [
      "it is a crude backoff",
      "it blocks the entire import",
      "a systematic error turns into hours",
      "it should be retryable-only and capped",
    ],
    [
      "says sleep makes the import faster",
      "ignores the swallowed row",
    ],
    "One line that looks harmless but changes the throughput and the error story.",
  ),
];

const csvTurns: SeedTurn[] = [
  {
    questionId: "csv-q1",
    questionIndex: 0,
    inputMode: "flow",
    answer:
      "It reads a CSV and inserts each row into the events table, skipping rows that already exist. It returns `inserted`, but that counts rows it tried to insert, not rows that were actually committed. The commit happens once at the end.",
    evaluation: ev({
      verdict: "partial",
      correctness: 3,
      depth: 3,
      ownership: 2,
      clarity: 3,
      confidence: 2,
      quote:
        "that counts rows it tried to insert, not rows that were actually committed",
      quoteIsStrength: true,
    }),
  },
  {
    questionId: "csv-q2",
    questionIndex: 1,
    inputMode: "flow",
    answer:
      "It makes re-running the import idempotent: a row that already exists is skipped, not overwritten. That’s safer for events because we don’t want to change an existing event. The cost is that if the source corrects a row, this function ignores the correction; you’d need an update or a version column.",
    evaluation: ev({
      verdict: "strong",
      correctness: 4,
      depth: 3,
      ownership: 3,
      clarity: 3,
      confidence: 2,
      quote: "if the source corrects a row, this function ignores the correction",
      quoteIsStrength: true,
    }),
  },
  {
    questionId: "csv-q3",
    questionIndex: 2,
    inputMode: "flow",
    answer:
      "The transaction isn’t committed yet, so the inserts roll back. But `inserted` has already been incremented for rows that will disappear, so the return value is wrong. Re-running is safe because of the conflict clause, but you lose all progress and the caller might think it succeeded. I’d commit in batches and count only after commit.",
    evaluation: ev({
      verdict: "strong",
      correctness: 4,
      depth: 4,
      ownership: 3,
      clarity: 4,
      confidence: 2,
      quote: "you lose all progress and the caller might think it succeeded",
      quoteIsStrength: true,
    }),
  },
  {
    questionId: "csv-q4",
    questionIndex: 3,
    inputMode: "flow",
    answer:
      "You can’t do one transaction or one row at a time. Use `COPY` into a staging table, then a single insert-select with the conflict clause. Batch the commits, add progress, and make the sleep a capped backoff. Memory stays flat because you’re streaming.",
    evaluation: ev({
      verdict: "strong",
      correctness: 4,
      depth: 4,
      ownership: 3,
      clarity: 4,
      confidence: 2,
      quote:
        "Use `COPY` into a staging table, then a single insert-select with the conflict clause",
      quoteIsStrength: true,
    }),
  },
  {
    questionId: "csv-q5",
    questionIndex: 4,
    inputMode: "flow",
    answer:
      "It’s a crude backoff, but it blocks the whole import for a second on one bad row. With ten million rows and a systematic error, that’s hours. I’d remove it or make it an exponential backoff with a cap, and only for retryable errors. Right now it also swallows the row and keeps going, so the caller doesn’t know which rows failed.",
    evaluation: ev({
      verdict: "strong",
      correctness: 4,
      depth: 4,
      ownership: 4,
      clarity: 4,
      confidence: 3,
      quote: "it blocks the whole import for a second on one bad row",
      quoteIsStrength: true,
    }),
  },
];

const csvReport: Report = {
  band: "ready",
  headline: "Quietly right. Knows the failure modes; needs to trust the answer.",
  summary:
    "Across five graded turns, correctness and depth were the strongest signals (3.8/4 and 3.6/4); ownership was the clearest gap (3.0/4). The candidate consistently hedged — “I’d commit in batches,” “I’d remove it” — but the reasoning was right, especially on the rollback and the ten-million-row change. At question 3, the answer correctly separated the transaction rollback from the already-incremented counter. The only thing missing is the confidence to make the call without hedging.",
  axes: [
    {
      key: "correctness",
      label: "Correctness",
      score: 3.8,
      evidenceQuote: "you lose all progress and the caller might think it succeeded",
      line: 9,
      note: "The rollback and the counter mismatch were both identified.",
    },
    {
      key: "depth",
      label: "Depth",
      score: 3.6,
      evidenceQuote:
        "Use `COPY` into a staging table, then a single insert-select with the conflict clause",
      line: 9,
      note: "The scaling answer moved from symptoms to a concrete plan.",
    },
    {
      key: "ownership",
      label: "Ownership",
      score: 3,
      evidenceQuote:
        "Right now it also swallows the row and keeps going, so the caller doesn’t know which rows failed",
      line: 21,
      note: "The sleep was treated as a design decision, not a harmless line.",
    },
    {
      key: "clarity",
      label: "Clarity",
      score: 3.6,
      evidenceQuote: "The transaction isn’t committed yet, so the inserts roll back",
      line: 9,
      note: "The failure story was clear and ordered.",
    },
  ],
  confidentButWrong: null,
  quietlyRight: {
    questionIndex: 2,
    quote: "you lose all progress and the caller might think it succeeded",
  },
  bestMoment: {
    questionIndex: 2,
    quote: "you lose all progress and the caller might think it succeeded",
  },
  nextQuestions: [
    "How would you report exactly which rows failed without aborting the whole import?",
    "What isolation level do you need for the batch commits, and why?",
    "How would you make the retry path handle only transient database errors?",
  ],
  createdAt: "2026-10-22T09:08:00.000Z",
};

const debounceFocus: FocusRegion[] = debounceQuestions.map((q) => ({
  start: q.focusStart,
  end: q.focusEnd,
  label: q.rung,
}));
const authFocus: FocusRegion[] = authQuestions.map((q) => ({
  start: q.focusStart,
  end: q.focusEnd,
  label: q.rung,
}));
const csvFocus: FocusRegion[] = csvQuestions.map((q) => ({
  start: q.focusStart,
  end: q.focusEnd,
  label: q.rung,
}));

export const seeds: Seed[] = [
  {
    id: "debounce",
    title: "The hook that never settles",
    subtitle:
      "A React debounce hook. Strong on the mechanics, one gap in the timer lifecycle.",
    band: "almost",
    language: "tsx",
    filePath: "src/hooks/useDebouncedValue.ts",
    repoLabel: "acme/search-ui",
    code: debounceCode,
    summary:
      "A custom React hook that delays a fast-changing value until the input has been quiet for a delay.",
    focusRegions: debounceFocus,
    questions: debounceQuestions,
    turns: debounceTurns,
    report: debounceReport,
  },
  {
    id: "auth",
    title: "The confident 401",
    subtitle:
      "Express auth middleware. The failure path hides a database outage behind an auth error.",
    band: "almost",
    language: "javascript",
    filePath: "src/middleware/auth.js",
    repoLabel: "acme/api",
    code: authCode,
    summary:
      "An Express middleware that verifies a Bearer JWT, loads the user, and returns 401 for missing, expired, invalid, or unknown-user tokens.",
    focusRegions: authFocus,
    questions: authQuestions,
    turns: authTurns,
    report: authReport,
  },
  {
    id: "csv",
    title: "The quiet import",
    subtitle:
      "A Python CSV ingest. The candidate hedges constantly — and is right almost every time.",
    band: "ready",
    language: "python",
    filePath: "scripts/ingest_events.py",
    repoLabel: "acme/warehouse",
    code: csvCode,
    summary:
      "A Python script that streams a CSV into Postgres with an idempotent insert, a single commit, and a sleep on row-level errors.",
    focusRegions: csvFocus,
    questions: csvQuestions,
    turns: csvTurns,
    report: csvReport,
  },
];

export function getSeed(id: string) {
  return seeds.find((seed) => seed.id === id) ?? null;
}

export function seedTurnFor(seed: Seed, questionIndex: number) {
  return seed.turns.find((turn) => turn.questionIndex === questionIndex) ?? null;
}
