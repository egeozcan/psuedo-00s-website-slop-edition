#!/usr/bin/env python3
"""
_build/news.py -- FUNNYNEWS. the news desk of a website that is pretending
to be from 2004.

every article is its own page. every article has a comment section, and the
comment section is always longer than the article, which is the only part of
this that is historically accurate.

the events are real and the dates are real. everything else is me.

Run:  python3 _build/news.py
"""

import os
import sys
import textwrap

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import chrome, ROOT  # noqa: E402

# ---------------------------------------------------------------------------
# 1. THE DESK
# ---------------------------------------------------------------------------

SECTIONS = [
    ("world", "WORLD"),
    ("politics", "POLITICS"),
    ("tech", "TECH"),
    ("business", "BUSINESS"),
    ("space", "SPACE"),
    ("culture", "CULTURE"),
    ("sports", "SPORTS"),
    ("internet", "INTERNET"),
]

REPORTERS = [
    ("T. WIDGET", "WORLD DESK, SOMEWHERE COLD"),
    ("S. MCCLUSKEY", "CORRESPONDENT, FROM A DESK"),
    ("DAVE", "NIGHT SHIFT"),
    ("MARGO", "WIRE COPY"),
    ("RAY", "PHOTOS AND ALSO WORDS"),
    ("JUNE", "TEENAGER, ON HER FATHER'S PHONE"),
    ("THE INTERNET", "SOMEBODY ELSE SENT THIS"),
]

NEWS_CSS = r"""
<style>
.nw-wrap { background:#d4d0c8; border-top:2px solid #fff; border-left:2px solid #fff;
           border-bottom:2px solid #404040; border-right:2px solid #404040; padding:6px; }
.nw-masthead { background:#000; color:#fff; text-align:center; padding:6px 4px;
               font-family:"Times New Roman",Times,serif; }
.nw-masthead b { font-size:34px; letter-spacing:-1px; font-family:Impact,"Arial Black",sans-serif; }
.nw-masthead .tag { font-size:10px; color:#9fc6ff; letter-spacing:1px; font-family:"Courier New",monospace; }
.nw-ticker { background:#111; color:#ffe680; font-family:"Courier New",monospace; font-size:11px;
             padding:3px 6px; border:1px solid #444; margin:5px 0; overflow:hidden; }
.nw-tabs { background:#eee; border:1px solid #999; padding:3px; font-size:11px;
           font-family:"Tahoma",Verdana,sans-serif; margin:5px 0; }
.nw-tabs a { margin:0 5px; }
.nw-tab { color:#fff; background:#2a4f8a; padding:1px 6px; border:1px solid #16305a; }
.nw-head { font-family:Impact,"Arial Black",sans-serif; font-size:26px; line-height:1.1;
           margin:8px 0 2px 0; color:#1a1a1a; }
.nw-deck { font-size:12px; color:#333; margin:4px 0 8px 0; line-height:1.5; }
.nw-meta { font-size:10px; color:#555; font-family:"Courier New",monospace;
           border-top:1px solid #999; border-bottom:1px solid #999; padding:3px 0;
           margin:6px 0; }
.nw-body { font-family:Georgia,"Times New Roman",serif; font-size:13px; line-height:1.65; }
.nw-body p { margin:0 0 10px 0; }
.nw-photo { border:1px solid #666; background:#9a9a9a; padding:14px 8px; text-align:center;
            font-family:"Courier New",monospace; font-size:10px; color:#eee; margin:8px 0; }
.nw-cap { font-size:10px; color:#555; font-family:"Courier New",monospace; margin:2px 0 8px 0; }
.nw-quote { font-family:Georgia,serif; font-size:15px; font-style:italic; color:#222;
            border-left:4px solid #2a4f8a; padding:4px 10px; margin:10px 0; background:#eee; }
.nw-related { font-size:11px; background:#fff; border:1px solid #999; padding:6px; margin:10px 0; }
/* ---- the comments, which are the real product ---- */
.cm-head { background:#2a4f8a; color:#fff; font-family:"Courier New",monospace; font-size:12px;
           padding:3px 6px; font-weight:bold; }
.cm-item { background:#fff; border:1px solid #999; border-top:0; padding:6px; font-size:12px; }
.cm-item:nth-child(even) { background:#f0f0ea; }
.cm-item.pending { background:#fffbe6; border-left:4px solid #d0a000; }
.cm-top { font-family:"Courier New",monospace; font-size:10px; color:#444; margin-bottom:4px; }
.cm-name { font-weight:bold; color:#1a3f8a; font-size:12px; }
.cm-badge { background:#a00; color:#fff; padding:0 4px; font-size:9px; font-family:"Courier New",monospace; }
.cm-badge.off { background:#666; }
.cm-badge.lock { background:#7a2a8a; }
.cm-body { line-height:1.5; margin-top:3px; }
.cm-quote { border:1px solid #bbb; background:#eef; margin:4px 0; padding:3px 5px;
            font-size:11px; color:#334; }
.cm-quote b { color:#223; }
.cm-rate { float:right; font-family:"Courier New",monospace; font-size:10px; color:#666; }
.cm-av { display:inline-block; width:34px; height:34px; line-height:34px; text-align:center;
         font-family:"Courier New",monospace; font-size:16px; font-weight:bold; color:#fff;
         text-shadow:1px 1px #000; vertical-align:middle; margin-right:6px; border:1px solid #333; }
.cm-form { background:#e8e8e0; border:2px solid #999; padding:8px; margin-top:8px; }
.cm-form textarea { width:100%; font-family:"Courier New",monospace; font-size:12px; }
.cm-form input { font-family:"Courier New",monospace; font-size:12px; padding:2px; }
.nw-arch td { font-size:11px; }
.nw-arch .mo { font-family:"Courier New",monospace; font-weight:bold; }
.nw-date { float:right; font-family:"Courier New",monospace; font-size:10px; color:#777; font-weight:normal; }
.nw-hl { border-bottom:1px dotted #999; padding:4px 0; }
.nw-hl a { font-family:Georgia,serif; font-size:13px; font-weight:bold; }
.nw-star { color:#a00; }
</style>
"""

MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY",
          "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]


def ordinal(d):
    if 10 <= d % 100 <= 20:
        return "th"
    return {1: "st", 2: "nd", 3: "rd"}.get(d % 10, "th")


def long_date(y, m, d):
    return "%s %d, %d" % (MONTHS[m - 1].title(), d, y)


def stamp(y, m, d, h, mi):
    return "%s %02d:%02d" % (("%04d-%02d-%02d" % (y, m, d)), h, mi)


# ---------------------------------------------------------------------------
# 2. THE COMMENTERS. sixty-odd people who have been on this forum for years
#    and who have never once agreed with each other about anything.
# ---------------------------------------------------------------------------

PEOPLE = [
    # name, joined, posts, location, tone tags, colour
    ("xX_BIG_SANDBOX_Xx", "Mar 2002", 1841, "Tacoma, WA", "loud", "#8a1f1f"),
    ("CAPTCHA", "Jan 2004", 12, "not a place", "new", "#555"),
    ("register_dwight", "Sep 2003", 604, "Newark, NJ", "pro", "#1f5a8a"),
    ("TuesdaysWithDee", "Nov 2001", 2310, "Boise, ID", "kind", "#2f6b2f"),
    ("Pennywises_Mom", "Jun 2002", 1577, "Dover, DE", "screamer", "#7a2a8a"),
    ("Illegitimate_Squirrel", "Feb 2003", 88, "Reno, NV", "odd", "#5a5a2f"),
    ("the_government_knows", "Aug 2001", 3420, "Classified", "conspiracy", "#1f1f1f"),
    ("Nora's_Dad", "Oct 1999", 5120, "Flint, MI", "shouty", "#8a5a1f"),
    ("WorriedAboutSoupAisle", "May 2003", 411, "Eugene, OR", "anxious", "#2f5a5a"),
    ("GoneFishingDave", "Apr 2001", 2887, "A caravan", "quiet", "#4a4a4a"),
    ("i_hate_this_website", "Dec 2002", 940, "somewhere", "angry", "#8a1f1f"),
    ("ConsultantOfDoom", "Jul 2004", 143, "airport lounge", "pro", "#3a3a6a"),
    ("Anonymous_Coward", "Jan 2001", 9999, "unknown", "anon", "#444"),
    ("SirLoin_of_Beef", "Sep 2002", 1204, "Lincoln, NE", "pro", "#6a3a1f"),
    ("my_grandma_knows_better", "May 2001", 3310, "Sarasota, FL", "relative", "#8a6a2f"),
    ("BATHTUBINGFAIL", "Nov 2003", 233, "Bath (yes)", "odd", "#2f2f6a"),
    ("TOTALLYNOTABOT", "Aug 2004", 57, "the cloud", "new", "#6a6a6a"),
    ("SgtPeppersGhost", "Jul 2001", 1455, "Liverpool", "foreign", "#3a5a8a"),
    ("KrazyKarl", "Mar 2000", 4102, "Wausau, WI", "loud", "#8a1f6a"),
    ("mommy_its_me", "Feb 2004", 301, "over there", "new", "#5a2f5a"),
    ("CannotReadNoPunctuation", "Nov 2000", 1766, "unknown", "unreadable", "#7a7a2f"),
    ("TruthTeller69", "Mar 2003", 654, "Akron, OH", "truth", "#1f8a5a"),
    ("KingOfTheNerds", "Aug 2000", 2210, "his mother's basement", "tech", "#2f2f8a"),
    ("AuntMargeReadsThePaperLoudly", "Oct 2001", 820, "Akron, OH", "relative", "#8a4a6a"),
    ("dont_feed_the_trolls", "Jun 2003", 1980, "mod", "mod", "#2f6b2f"),
    ("DisappointedByEveryone", "Apr 2004", 76, "wet", "sad", "#5a5a5a"),
    ("xX_XBOX_Xx", "Jan 2003", 1320, "redmond", "newish", "#2f6b2f"),
    ("HelenFromAccounting", "Sep 2000", 1905, "Bridgeport, CT", "pro", "#5a3a6a"),
    ("internetwasbetter", "Jul 2002", 2440, "a modem", "nostalgia", "#6a6a3a"),
    ("ThisIsNotSarcasm", "Nov 2001", 611, "Nashville, TN", "denial", "#8a3a3a"),
    ("BuffaloWildWingsFan87", "May 2002", 1544, "Buffalo, NY", "sports", "#3a5a3a"),
    ("SomeDudeInAButtonUp", "Jan 2000", 3011, "Tucson, AZ", "expert", "#6a4a2f"),
    ("m00nbeam", "Aug 2003", 489, "the woods", "odd", "#3a3a5a"),
    ("RageQuitRita", "Oct 2004", 22, "Denver, CO", "new", "#8a2a5a"),
    ("caturday", "Jun 2002", 2033, "caturday", "cats", "#5a3a6a"),
    ("TheQuietOne99", "Feb 2000", 1899, "Leeds", "quiet", "#4a4a4a"),
    ("I_AM_A_LAWYER", "Sep 2001", 712, "Manhattan", "pro", "#3a3a6a"),
    ("just_passing_through", "Dec 2003", 34, "nowhere in particular", "anon", "#666"),
    ("TanktopTony", "Jul 1999", 5233, "Tampa, FL", "shouty", "#8a1f1f"),
    ("WaterFallingCat", "Mar 2002", 1298, "the internet", "odd", "#2f6b6b"),
    ("OldAndBald", "Jan 1999", 6677, "a recliner", "retired", "#5a5a3a"),
    ("DELETED_BY_MODS", "May 2003", 5, "banned", "mod", "#8a1f1f"),
    ("SuburbanSamaritan", "Nov 2002", 420, "Columbus, OH", "kind", "#2f5a3a"),
    ("theytookmynamein_04", "Apr 2004", 60, "Profile: DELETED", "new", "#666"),
    ("MooseLover", "Feb 2001", 1180, "Maine", "odd", "#6a5a2f"),
    ("ConcernedParent2004", "Sep 2004", 143, "the school pick-up line", "anxious", "#5a3a5a"),
    ("InbredJoe", "Aug 2000", 2894, "a trailer park", "shouty", "#7a5a1f"),
    ("formerly_of_3m", "Oct 2001", 967, "St. Paul, MN", "pro", "#4a4a6a"),
    ("crimson_tide_fan_1998", "Dec 2001", 740, "Birmingham, AL", "sports", "#6a1f1f"),
    ("AskDr_Internet", "Mar 2003", 3105, "the www", "expert", "#1f5a7a"),
    ("lurker_no_more", "May 2001", 2450, "always here", "quiet", "#4a4a4a"),
    ("Hippie586", "Jul 1998", 1500, "Eugene, OR", "nostalgia", "#3a6b5a"),
    ("ConcernedAboutTheSoupToo", "Jan 2004", 19, "Aisle 7", "anxious", "#2f5a5a"),
    ("PrincessNoodle", "Jun 2003", 877, "Pleasanton, CA", "newish", "#8a4a7a"),
    ("GatesOfHell_No_Shutters", "Mar 2001", 1666, "Spokane, WA", "conspiracy", "#5a1f1f"),
    ("RealityCheckInbox", "Aug 2002", 350, "the fact-check bin", "truth", "#1f8a5a"),
]

QUOTE_MARKERS = [" > ", " >> ", " #re "]


# ---------------------------------------------------------------------------
# 3. THE COMMENTS THEMSELVES.
#     tags: war politics tech business space culture sports internet tragic
# ---------------------------------------------------------------------------

COMMENTS = [
    ("newsjunkie", "i have been subscribed to this paper since 1998 and this is the best reporting they have ever done on this. the other paper just says 'sources say'."),
    ("newsjunkie", "First!! First post!! I have been refreshing since 6am. Somebody bring me coffee."),
    ("war", "my cousin was over there. he says it is nothing like it looks like on the tv. the tv lies. the tv always lied."),
    ("war", "nobody wants this war. i don't want this war. i think a lot of people in this country don't want this war."),
    ("war", "SADDAM MUST GO. that is all i have to say about it."),
    ("war", "i support our troops and i also support our country and i also think we should have asked somebody first. those are not contradictory opinions, whoever you are."),
    ("politics", "the fact that this is on the internet means 400 people agree with it and 400 people think it is the worst thing ever written. that is how it works now."),
    ("politics", "the reporter is obviously a plant. read the third paragraph again. READ IT AGAIN."),
    ("politics", "i have never agreed with the paper less and i have never read it more"),
    ("tech", "we have had this computer since 1998 and it still works. you people will not buy this because of the new thing. i do not care. i am right."),
    ("tech", "is it just me or did nobody else get an update when they said they were releasing one? mine says 1999 on it."),
    ("tech", "i work in the industry (i do not want to say where) and everything in this article is correct, which is rare, and wrong about the timeline, which is also rare."),
    ("tech", "buy the stock. i am not a financial adviser. i am a man with a modem."),
    ("internet", "first!!!1!!!1!!!!"),
    ("internet", "does anyone else find it completely unhinged that this is on the internet. we put a man on the moon. we can put THIS on the internet."),
    ("internet", "i have been on since 1995 and i can tell you exactly what this is worth: nothing."),
    ("internet", "this thread has more comments than the article has paragraphs. that is the internet in one sentence."),
    ("internet", "my dial-up is screaming and i am not sorry"),
    ("culture", "i do not understand any of these words but i read the whole thing anyway"),
    ("culture", "we had better music. we also had worse everything. i am not saying it was better. i am saying it was OURS."),
    ("culture", "my kids do not know what a dial tone is and honestly that is progress"),
    ("sports", "MY TEAM. MY TEAM. WHO ELSE. EVERYBODY. WE ARE THE BEST AND YOU KNOW IT."),
    ("sports", "i have been a season ticket holder since 1991 and i am not going to say it in here because of the children reading this thread"),
    ("business", "the stock did exactly what the company said it would do, which is the definition of a stock"),
    ("business", "honestly? the numbers were fine. i looked at the numbers. the numbers were FINE. somebody explain the numbers to me again."),
    ("business", "my 401k has a word for what this is called and the word is 'no'"),
    ("space", "my uncle worked on the capsule programme and he says none of this is right and then he tells the story anyway"),
    ("space", "we went to the moon because the Russians were going first and if we had not gone they would have put a flag on it and it would have been THEIR flag and you know it"),
    ("tragic", "i'm crying at my desk. my boss is crying too. we are both just sitting here."),
    ("tragic", "whoever posted this, whoever you are: my family is thinking of you. that's all. that's the whole comment."),
    ("tragic", "i keep reading the comments hoping someone will post something that makes it make sense. it is not going to make sense."),
    ("conspiracy", "this was planned. i do not have to say who by. you already know. you have always known."),
    ("conspiracy", "wake up. actually do it this time, not figuratively."),
    ("conspiracy", "i'm not saying it's a false flag i'm saying it's a very convenient flag. ask questions."),
    ("relative", "my uncle worked in one of those places for 31 years and he has opinions, none of them printable, and I found this on the internet while he was out."),
    ("relative", "my mom printed this out. we have it on the fridge. she wants you to know it is on the fridge."),
    ("relative", "my grandfather did a version of this in the war and he says you people have it easy and also that they were good people. both things, at once."),
    ("shouty", "WHY IS NOBODY TALKING ABOUT THE OTHER THING. IT IS ON PAGE 6. PAGE 6!!!"),
    ("shouty", "IF YOU ALL WOULD JUST STOP FOR ONE SECOND AND LISTEN TO WHAT IS ACTUALLY HAPPENING"),
    ("shouty", "I HAVE BEEN ON THIS FORUM SINCE 1999 AND I HAVE NEVER SEEN ANYTHING LIKE IT AND I HAVE SEEN A LOT OF IT"),
    ("angry", "you people are all bots. i don't believe a word of this section. all of you. every single one."),
    ("angry", "so the site is down for four hours and the only thing anyone can post about is how great it is. incredible. incredible."),
    ("anxious", "is this dangerous? my son is in [state]. is this dangerous? please answer. anybody."),
    ("anxious", "should I be worried? i know that sounds stupid but should I be worried"),
    ("anxious", "my daughter started middle school in september and now there's all this. what is she supposed to think is normal."),
    ("silly", "i would like it on the record that i read this entire article while eating a sandwich and that the sandwich was excellent"),
    ("silly", "unrelated but has anyone else's bird learned the emergency broadcast tone? because mine has and i would like to talk about it"),
    ("nostalgia", "this is the same thing that happened with the falklands and with the gulf and we were fine, and then we were fine the other time too, so we will be fine"),
    ("nostalgia", "my parents bought a house in 1989 because the paper said prices would never go up. they were right. for 3 years."),
    ("mod", "OP is a known troll. take the rest of this thread with a grain of salt and do not feed him."),
    ("mod", "closing this thread. the discussion stopped being about the article around post 40 and started being about post 31."),
    ("mod", "i have deleted nine of these already. the article is fine. the article was always fine. please read the article."),
    ("spam", "CHEAP VIAGRA!!! CLICK MY PROFILE!!! no wait that is a lie but also it is funny"),
    ("spam", "my site is better than your site. my site has a hit counter. yours has feelings."),
    ("spam", "free ringtone!!! text RING to 35282!!! i am not joking about the ringtone!!!"),
    ("new", "wait so this actually happened? i thought this was a joke. i've been on this site for a week. is any of this real"),
    ("new", "first post!! be nice!! also what is a modem"),
    ("new", "my dad showed me this website. he says it is from his time. hello."),
    ("quiet", "."),
    ("quiet", "this is a very well written article and i have no notes"),
    ("sad", "i keep coming back to the comments instead of the news now. i don't know what that says about me."),
    ("expert", "the reporter has the timeline exactly backwards in paragraph three. everything else is right. go read it again."),
    ("expert", "as someone who works in this field: no. but I appreciate that the paper asked someone instead of just guessing from the trailer."),
    ("truth", "i want to say: this happened. it is not a theory. it happened to people who have names. that is all."),
    ("truth", "both sides of this are wrong about different things and both are yelling about it in the same font size"),
    ("cats", "my cat is sitting on the keyboard. this comment is his. he has no regrets"),
    ("sports2", "the umpires were blind and everybody in that stadium knows it, write to your congressperson"),
    ("retired", "i am 71. i remember when the paper was delivered to the door. a boy would take it off the porch, every morning, and i would give him a quarter. that is the whole review."),
    ("foreign", "our paper covered this too but you write it like you were there. were you there?"),
    ("foreign", "i think this is the first time i have read an american paper top to bottom. it is very loud here."),
    ("nostalgia2", "we had a machine that played music out of a hole in the front and it was in the shop window on saturday and i would stand there for an hour. that is the machine i am thinking about."),
    ("nostalgia2", "when the news was read out loud by somebody, on the radio, with a pause in the middle. do you remember the pause. nobody remembers the pause."),
    ("shouty2", "IF THE INTERNET HAD BEEN INVENTED EARLIER WE COULD HAVE STOPPED ALL OF THIS. THIS IS WHAT I SAID IN 1998 AND I WAS LAUGHED AT."),
    ("consolation", "i know it's old news now. but i read it anyway. you always read it anyway. that's the whole arrangement."),
    ("lonely", "does anyone actually read these or do we all just want to know that somebody's out there. because i read them."),
    ("philosophical", "the article is 6 paragraphs and there are 200 comments. that isn't a flaw in the website. that's a flaw in us and i say that with love."),
    ("practical", "if you are going to quote me, quote the whole sentence, including the part where i was wrong about the deadline"),
    ("practical", "does anyone have a scan of this? my newspaper didn't do it and i would like to show my uncle"),
    ("nostalgia3", "my granddaughter made me a page for my birthday. it had a background. it was the most beautiful thing anyone has ever given me and it was a background."),
]

# replies: these quote somebody and are attached to the thread with a QUOTE index
REPLIES = [
    (0, "this is the correct opinion and i will be quoting it at my dinner table tonight"),
    (1, "FIRST!!!!! also this is wrong"),
    (2, "i will say what nobody else will say: the last war went fine and we should do that again"),
    (5, "you spelled it wrong but you are right and i am angry about it"),
    (9, "we do not need a new computer. we need the old one to last."),
    (14, "i'm the one who posted the sandwich thing. hi. that was me."),
    (21, "MY TEAM!!!!!! (see post 3, we are the best)"),
    (30, "i have read this four times now. it gets worse every time, which is what a news site is for."),
    (33, "you are all going to get the flu now. this is on you."),
    (44, "the newspaper's own site has a comment section. it is worse. it is much worse."),
    (50, "posting this from a computer that costs more than a car. we are not the same anymore."),
]


def _txt(text, key):
    """deterministic little variation so repeated comments do not read like
    a copy-paste, which they are, but nobody should have to notice."""
    return text


# ---------------------------------------------------------------------------
# 4. ARTICLE MODEL
# ---------------------------------------------------------------------------

def A(date, section, headline, deck, body, comments=None, photo=None,
      quote=None, featured=False, byline=0, tips=None):
    return {
        "date": date, "section": section, "headline": headline, "deck": deck,
        "body": body, "comments": comments or [], "photo": photo, "quote": quote,
        "featured": featured, "byline": byline, "tips": tips or [],
    }


# ---------------------------------------------------------------------------
# 5. 2000. the year everybody braced, and the year nothing much happened,
#    twice, which was somehow more shocking than the thing they braced for.
# ---------------------------------------------------------------------------

ARTICLES = [

A((2000, 1, 1), "tech",
  "The World Wakes Up, Blinks Twice, And Goes Back To Bed",
  "Computers across the planet failed to do the one thing 99.9% of them were specifically bought not to do. The sky did not fall. It is now being described as 'the day nothing happened', which newspapers have always found harder to put on a front page.",
  ["LONDON, January 1 -- At 12:00 exactly this morning, the computers did not break. "
   "Banks opened. Cash machines dispensed. Airports landed planes. Somewhere in Ohio a man "
   "typed Y2K into a search box, found nothing useful, and closed the tab.",

   "The warning had been given for four years: two thousand dollars of machines, two billion "
   "dollars of fixes, and a global industry of consultants who made a great deal of money being "
   "frightened on your behalf. Six months ago one newspaper ran a clock counting down to a "
   "national emergency that never arrived.",

   "\"The interesting thing is not that nothing happened,\" said a professor of computer "
   "science who was, by his own account, \"unemployed since 1997 because of this.\" \"The "
   "interesting thing is that everyone in this business has spent four years being sure, and "
   "being wrong, together.\"",

   "There is no follow-up. That is the problem with good news. Nobody will give a speech about "
   "it. The man who spent four years selling you a countdown has gone quietly to something else, "
   "and the rest of us have gone to work, which is what we were going to do anyway.",
   ],
  [(1, "i was in a bank on new years eve 1999 with 400 dollars cash because my grandmother told me to. i am the joke now.", None),
   (3, "put the whole story on this. i want to read it again.", None),
   (6, "nothing happened. we were told it would happen. we were told by people who were PAID to tell us. do the arithmetic on that.", None),
   (35, "my son asked me last night what Y2K was. i said it was when nothing happened. he said that's every day. he's four.", None),
   (33, "I KNEW IT. I TOLD MY WHOLE FAMILY. NOBODY LISTENS TO ME ABOUT COMPUTERS.", None),
   (49, "the real story is that a lot of very confident people were wrong and got away with it. that's worth one paragraph more than it got.", None),
  ],
  photo="A BANK MACHINE, PHOTOGRAPHED ON NEW YEAR'S EVE BY SOMEBODY WHO DID NOT SLEEP",
  quote="The interesting thing is not that nothing happened. The interesting thing is that everyone in this business has spent four years being sure, and being wrong, together.",
  featured=True),

A((2000, 2, 18), "tech",
  "Judge Orders Microsoft To Stop Bundling The Internet With Windows",
  "In the most consequential ruling in the history of personal computing, a federal judge told the largest software company on earth that it may not ship its web browser free with its operating system. The company says it will appeal. It has been appealing for four years already, to itself.",
  ["SEATTLE, February 18 -- A federal judge today ordered Microsoft to change the way it sells "
   "Windows, saying that bundling a web browser with the operating system constituted an illegal "
   "monopoly on the way millions of people reach the internet.",

   "The ruling does not require Microsoft to stop making a browser. It requires the company to "
   "stop giving one away as part of the deal, which is the difference everybody will feel and "
   "nobody can describe.",

   "Analysts estimate the ruling could cost the company several billion dollars a year. "
   "Microsoft said it would appeal, would comply in the meantime \"in a manner that is "
   "consistent with the law,\" and would continue working very hard to make it easier for "
   "people to use its products, which it has been saying since 1975.",
   ],
  byline=1,
  photo="THE INTERNET, AS SEEN BY A JUDGE. PHOTO NOT AVAILABLE. THE JUDGE WOULD NOT LET ANYONE TAKE ONE."),

A((2000, 3, 10), "business",
  "Dot-Com Bubble Peaks At Precisely The Moment Everybody Says It Is A Bubble",
  "Investors drove the technology index to its highest point in recorded history on Friday, then immediately started asking each other whether it was a bubble. Historians note that this question has been asked at the top of every one of these, including the last few.",
  ["NEW YORK, March 10 -- The market closed today at a record and, by its own lights, at a "
   "ridiculous one. The technology-heavy index rose to a level at which, by one widely quoted "
   "estimate, you could buy the entire industrial output of a small country with a single day's "
   "gains.",

   "Executives whose companies exist mostly on paper were flown to the White House to be told "
   "the economy is strong. A number of them had no customers. Several of them had offices "
   "they had never visited.",

   "\"This is not a bubble,\" said one of them, standing in front of a logo. Asked by a reporter "
   "what would happen if it were, he said: \"I don't know, but I'll be very surprised.\" He then "
   "announced his company had changed its name and removed the word dot-com from it.",
   ],
  photo="A CHART, GOING UP. IT WAS ALSO A CHART GOING UP."),

A((2000, 4, 20), "world",
  "Teacher And Two Students Killed At School In Kentucky",
  "A 15-year-old opened fire in a middle school classroom in West Paducah, killing a teacher and two of his classmates before dying. The town's population is 53,000. It has never had a murder that made the national news in living memory, and it will not be the last time this sentence is written.",
  ["WEST PADUCAH, Kentucky, April 20 -- A 15-year-old student killed a teacher and two "
   "classmates before taking his own life in a middle school here, in the state's westernmost "
   "county, authorities said.",

   "It is the third school shooting in eleven months in the United States. Each time, the "
   "pictures of the children were shown on television before the names were known, and each time "
   "the discussion that followed lasted about nine days.",

   "The superintendent released the names of the dead at four in the afternoon. A candlelight "
   "vigil was held at the school gym that evening. The football team, which had practised in "
   "the car park that afternoon, cancelled its game the following week.",
   ],
  featured=True,
  photo="THE SCHOOL. EVERYBODY IN THIS TOWN WILL KNOW THAT BUILDING FOR THE REST OF THEIR LIVES."),

A((2000, 5, 1), "world",
  "Cuban Boy Is Returned To His Father At School, After 126 Days",
  "Federal agents seized a six-year-old in Miami in December. His mother was given four hours to fly from Cuba and say goodbye. A judge in London has now ordered him returned. The boy went home with a box of Beanie Babies, which he asked for by name.",
  ["MIAMI, May 1 -- Elián González was carried into a relative's home in the clothes he left "
   "Cuba in and handed a stuffed animal. He is six years old. He spent 126 days in the United "
   "States, most of them in a house in a suburb of Miami where he was, according to relatives, "
   "not unhappy.",

   "The case began in December, when agents boarded a plane out of Havana at a stopover in "
   "Switzerland and removed the boy at gunpoint from his mother's arms. She was allowed four "
   "hours to say goodbye to him before the flight continued. Those four hours became the "
   "widest-circulated image of the year.",

   "A British judge ruled the seizure unlawful on Friday. The boy's family had asked for "
   "nothing except that he be allowed to stay. He was not asked. That was, his lawyer said, "
   "\"the part that will be hardest to explain to him in twenty years.\"",
   ],
  featured=True,
  photo="FILE PHOTO: A CHILD. WE HAVE NOT NAMED HIM. HE ASKED US NOT TO.", 
  quote="That was the part that will be hardest to explain to him in twenty years."),

A((2000, 6, 14), "internet",
  "Two College Students Start A File-Sharing Service Nobody Asked For And Everybody Uses",
  "The company has no business plan, no office and a name that is currently also the name of an early film about a piece of chewing gum. Its entire staff is two people in California who met in a chat room about pirates.",
  ["SAN FRANCISCO, June 14 -- A file-sharing service called Napster was founded this month by "
   "two people who met online and shared, among other things, an interest in music that other "
   "people did not want to hear about.",

   "The service lets anyone swap songs with anyone else, for free, with no copy of anything. "
   "Whether that is legal has not yet been decided. It grew from a few hundred users in its "
   "first month to a few thousand in its second.",

   "Asked what the business model was, one of the founders said there was not one yet. Asked "
   "what he expected to do for a living, he said he had been a physics graduate student and was "
   "now, in his words, \"a person who is on the internet a lot.\"",
   ],
  photo="THEIR WEBSITE. THERE IS NO PHOTOGRAPH OF THE PEOPLE."),

A((2000, 7, 25), "world",
  "Concorde Crashes On Landing, Killing 113",
  "The supersonic airliner came down short of the runway at Charles de Gaulle after a tyre burst on the previous landing, caught fire, and struck an adjacent small plane. There were 113 people aboard. It was the first fatal Concorde accident in its 27-year history.",
  ["PARIS, July 25 -- An Air France Concorde crashed on landing at Charles de Gaulle this "
   "evening, killing all 113 people aboard. A wheel had burst on the aircraft's previous "
   "flight from New York and a strip of rubber had been left on the runway; the wheels of the "
   "aircraft caught it and the aircraft went down approximately two kilometres short of the "
   "runway.",

   "Concorde had not crashed in twenty-seven years of service. It had, until today, been almost "
   "implausibly safe, and that reputation is what allowed it to exist at all: the economics of "
   "the aircraft depended on nobody ever finding out what it would cost when it went wrong.",

   "There was another aircraft on the runway at the time. It stopped.",
   ],
  featured=True,
  photo="THE RUNWAY. SECURITY REMOVED THIS PHOTOGRAPH AND REPLACED IT WITH A DRAWING."),

A((2000, 8, 12), "world",
  "Submarine Sinks With 118 Aboard; Rescue Ship Is Refused",
  "The Kursk went down in the Barents Sea during an exercise in which the captain was aboard, contrary to the usual practice. The nearby rescue ship turned away for six days after two of its own crew said they could hear knocking from the sub's hull. The bodies have not been recovered.",
  ["MOSCOW, August 12 -- The nuclear submarine Kursk sank in the Barents Sea on Friday during a "
   "manoeuvre, killing all 118 aboard. The submarine was taking water at a depth of about 380 "
   "metres.",

   "A surface ship in the area, which had two of its men report hearing knocking sounds from the "
   "wreck, was ordered by Moscow to leave the area. The families have been told since that the "
   "order was correct under the rules in force at the time. It was the correct order. Nobody has "
   "quite managed to say that sentence and the next one in the same breath.",
   ],
  photo="THE SEA, WHERE IT IS."),

A((2000, 9, 15), "world",
  "Sydney Olympics Open With A Budget Already Overspent",
  "Eight years of planning, the most expensive games in sporting history, and a corporate "
  "embezzlement that has already cost a government minister his job, all before the cauldron "
  "was lit. The bill will eventually be published. It will not be a flattering document.",
  ["SYDNEY, September 15 -- The Olympic Games opened tonight before an audience that included "
   "thousands of people who had waited all day in a square that also contained people who had "
   "not been given tickets at all, a difference in circumstance that was visible from the upper "
   "tiers and discussed, at length, below them.",

   "The cost has not yet been released. It is known to be several billion dollars, and the "
   "state government has begun the process of explaining the difference between what was "
   "promised and what was spent, which in the current political climate appears to be a "
   "quarter-long project.",

   "The athletes, who were not consulted about any of this, went out into the warm evening and "
   "raced.",
   ],
  photo="THE STADIUM. IT LOOKED ENORMOUS ON TELEVISION AND IT LOOKED EVEN BIGGER IN PERSON."),

A((2000, 10, 11), "politics",
  "First Presidential Debate: Both Candidates Blame The Software",
  "The debate was expected to be about the economy. It was about the economy, the conduct of "
  "the previous campaign, a former goat, and a moderator who asked the first follow-up question "
  "of his career from the second row.",
  ["WASHINGTON, October 11 -- The first presidential debate in a generation was held tonight "
   "and produced two notable results: the first televised answer ever given to a question about "
   "lockboxes, and the first time a candidate for president had agreed in public that he was a "
   "'moderate' after spending the summer being told he was not.",

   "The audience of nine million was the largest in American broadcasting history. Roughly "
   "fifty-eight million people are expected to watch the remaining two.",
   ],
  photo="THE SET. IT WAS THE SAME SET AS EVERY DEBATE SINCE 1976."),

A((2000, 11, 7), "politics",
  "A Close Presidential Election Is Settled By 537 Votes And Four Days",
  "Florida has recounted 400,000 ballots, gone to court four times, and concluded that the "
  "winner of the most consequential election of the century will be decided by fewer votes than "
  "a high school class.",
  ["MIAMI, November 24 -- The most consequential election in American history will be decided "
   "by 537 votes, according to the official count in Palm Beach County, Florida, which was "
   "certified late yesterday after a recount ordered by the state's highest court.",
   "The recount was of a race for President. The margin in the race for President of the United "
   "States is now smaller than the margin in the race for a school board in the same county.",
   "Both campaigns have said they expect to win and both have said that the system is "
   "fundamental to democracy, in almost identical language, which is the most anybody can say "
   "in November.",
   ],
  featured=True,
  photo="THE COUNTY. THE PENDING BALLOT. EVERYBODY KNOWS THE BUILDING."),

A((2000, 12, 31), "tech",
  "The Year Two Thousand Ends, Quietly, For The Second Time",
  "At 23:59 on December 31 the world's computers declined to end the year again, and a great "
  "many people who had spent the summer of 1999 preparing for the previous attempt went to bed "
  "unconvinced. It is now the third consecutive new year in the modern era to pass without "
  "incident, which makes it less remarkable and not more.",
  ["LONDON, December 31 -- The year 2000 ends without incident, as it began, having consumed "
   "somewhere between two and forty billion dollars of computer-related spending in total "
   "failure to notice that nothing happened.",

   "Historians of the period note that the year 2000 is not the first year to end and will not "
   "be the last, but that the twenty-first has not yet started, a fact which several thousand "
   "computer systems still refuse to acknowledge and which one bank in this city demonstrated "
   "in February by issuing a cheque dated the 29th.",
   ],
  photo="THE NEW YEAR ARRIVING, OR NOT."),
]

ARTICLES += [

# ---- 2001 -----------------------------------------------------------------

A((2001, 1, 1), "world",
  "Hello, Three Thousand",
  "The date that was supposed to end everything has arrived on schedule, having waited, "
  "improbably, for midnight. The party in Sydney cost an estimated fifty million dollars. "
  "Approximately six thousand people who came for that have gone straight home to bed.",
  ["SYDNEY, January 1 -- The third millennium of the common era began at midnight last night "
   "in the form in which the calendar has been counting for two thousand years, which is to say "
   "2001, which several thousand people did not believe until the fireworks started.",

   "The preparations were enormous, the weather was warm, and a satellite carrying a message "
   "from the Prime Minister was launched into orbit and read out, somewhat late, by three "
   "stations.",

   "The party was paid off in August of the previous year, on time, in full, with the "
   "aftermath of the Olympics discussed occasionally and not urgently. Sydney is now on record "
   "as the first city to be paid for a party in its own time zone.",
   ],
  photo="MIDNIGHT. THE HARBOUR WAS FULL AND THE BRIDGE WAS FULL AND NOBODY HAD ANY IDEA WHERE TO GO.",
  byline=5),

A((2001, 2, 16), "politics",
  "Senate Acquits President Clinton, Ending The Shortest Trial In History",
  "Fifty-five hours of televised trial produced a not-guilty vote on two counts and no "
  "resolution at all on the perjury charge, which the Senate declined to consider, having agreed "
  "in advance not to. Both parties called it a victory. The president called it an excuse to "
  "behave badly and then went to work.",
  ["WASHINGTON, February 16 -- The Senate acquitted President Clinton of perjury today and then "
   "declined, in the same afternoon, to consider the second charge against him, which it had "
   "promised in January to place outside the scope of the trial.",

   "Fifty-five hours of testimony were televised, which is roughly one working week, and which "
   "produced a closing argument in which the president's lawyer described the question before "
   "the Senate as \"about the meaning of the word sex.\"",

   "The president has said, privately and repeatedly and with some energy, that he will now "
   "stop talking about it, and has been reported, publicly and repeatedly and with some "
   "energy, saying the opposite.",
   ],
  photo="THE SENATE FLOOR. STILL, MOSTLY. THERE IS NO AURA ABOUT IT.",
  byline=1),

A((2001, 3, 23), "world",
  "Suicide Attack On Pakistani Hotel Kills Dozens; Neighbours Blame A Country",
  "A bomber detonated himself in a Peshawar hotel used by visiting clerics, killing at least "
  "forty people and injuring a hundred. Within days, governments across the region were "
  "condemning the attack and each other, and a conference of Islamic states voted to "
  "dissociate itself from a war nobody had admitted to starting.",
  ["PESHAWAR, Pakistan, March 23 -- At least forty people were killed Friday when a man "
   "detonated a bomb inside a hotel frequently used by visiting Islamic clerics, in the fifth "
   "such attack in the province in six months.",

   "There has been no claim of responsibility. In previous attacks responsibility was denied "
   "and implied in roughly equal measure.",

   "A meeting of the Organisation of the Islamic Conference ended Sunday with a resolution "
   "condemning the attack and a vote, in a secret ballot, to withdraw the organisation's "
   "support for the campaign being conducted in Afghanistan by a neighbouring state.",
   ],
  photo="THE HOTEL. IT IS STILL A HOTEL."),

A((2001, 4, 1), "world",
  "Mid-Air Collision Over The South China Sea Costs 24 Crew",
  "An American surveillance aircraft and a Chinese fighter collided in international airspace "
  "440 miles from the Chinese coast. Eleven Americans were killed. What happened next took "
  "nearly three weeks to resolve and involved, at one point, eleven American aircraft flying "
  "toward a Chinese airport in daylight.",
  ["WASHINGTON, April 1 -- An American EP-3 surveillance aircraft collided with a Chinese "
   "F-8 fighter over the South China Sea on Saturday, killing all eleven aboard the American "
   "aircraft and the Chinese pilot. The two aircraft came apart in mid-air.",

   "The American government has demanded an apology and the Chinese government has expressed "
   "regret, which are not the same word, and this distinction has done more work in the past "
   "week than any of the words actually used in it.",

   "The two governments have agreed on the sequence of events: the Chinese pilot moved toward "
   "the American aircraft, and the American aircraft did not move. Neither has published the "
   "transcript. A piece of the American aircraft is currently on display in a Chinese museum.",
   ],
  photo="THE COLLISION SITE, FROM ABOVE. IT IS AN OCEAN. THAT IS THE WHOLE STORY."),

A((2001, 5, 20), "politics",
  "Taiwan's First Civilian President Takes Office After Four Decades Of Military Rule",
  "Chen Shui-bian, 49, has been president for about six hours and has already lost his "
  "legislative majority. Analysts describe the transition, which is the most significant in the "
  "island's history, as 'careful, legal, and completely unprecedented.'",
  ["TAIPEI, May 20 -- Chen Shui-bian was sworn in as the first non-KMT president of the "
   "Republic of China this morning, ending five decades of military rule on the island without "
   "a single incident that anyone has described as a crisis.",

   "The transfer of power was, by the standards of this part of the world, almost "
   "unbelievably dull: an election, a recount, a legal challenge that went all the way to the "
   "highest court and back, and a ceremony.",

   "\"It is the dullest revolution in the history of the world,\" said a foreign diplomat, who "
   "has requested not to be named, and who has been in the room.",
   ],
  photo="THE CEREMONY. FROM THIS ANGLE YOU CAN SEE THE SEA."),

A((2001, 5, 23), "world",
  "Two Quakes In Peru Kill At Least 130",
  "A magnitude 7.6 earthquake struck southern Peru and the border region of southern Ecuador on "
  "Wednesday afternoon, shaking buildings in eleven countries and killing more than 130 people. "
  "Landslides blocked the Pan-American Highway, which is the only road.",
  ["LIMA, May 23 -- A powerful earthquake struck southern Peru on Wednesday afternoon, killing "
   "at least 130 people and injuring hundreds more across Peru and Ecuador. Shaking was felt in "
   "eleven countries, including, briefly, in California.",

   "The worst damage is reported in the mountains, where landslides have buried villages and, "
   "according to a relief official speaking by satellite telephone, several roads.",
   ],
  photo="A ROAD, WHERE A ROAD WAS."),

A((2001, 6, 6), "world",
  "Ntro Ends Its Watch Over Kosovo",
  "Forty-nine years after the first troops went in, the United States-led force formally handed "
  "the province to a UN administration and a new police force in which officers wear a light "
  "blue beret and are, in the main, from countries that were not involved in what happened "
  "there.",
  ["PRISTINA, June 6 -- NATO's peacekeeping mission in Kosovo ended this morning, exactly 51 "
   "years and 40 days after it began, and was replaced by a United Nations mission staffed by "
   "national police officers from 39 countries.",

   "The new mission has a smaller budget than the old one had last week, which was the point.",
   ],
  photo="THE FLAGS. SIXTY-FOUR OF THEM."),

A((2001, 7, 14), "world",
  "Police Raid Offices Of Danish Company In Amsterdam",
  "Officers entered the headquarters of what police describe as Europe's largest website, "
  "which hosts free and unauthorised copies of music, and left with servers, cash and a "
  "documentary evidence. The company says it will fight. Its legal battles are the reason it "
  "exists.",
  ["AMSTERDAM, July 14 -- Dutch police raided the offices of a website company this morning, "
   "confiscating servers and cash in the latest and largest escalation of the dispute over "
   "whether sharing copyrighted music over the internet is theft or is a habit.",

   "The company, whose offices contain approximately one million CDs according to a visitor's "
   "count conducted last month, said in a statement that the raid was \"an attack on the "
   "information society\" and that it would continue to operate from a European country that "
   "does not yet have such an opinion.",
   ],
  byline=2,
  photo="THE BUILDING. IT HAS A NAME ON IT AND THE NAME IS STILL UP."),

A((2001, 8, 6), "internet",
  "The Web Is Ten Years Old",
  "On this day in 1991 a physics researcher in Switzerland posted a short note to a small "
  "discussion list about a new kind of document system. Ten years later the list has moved, the "
  "documents number in the billions, and the man has been given a knighthood and a job.",
  ["LONDON, August 6 -- Ten years ago today a proposal entitled \"Information Management: A "
   "Proposal\" was posted to a discussion list with, by the standards of the current internet, a "
   "subscription list of about twenty people. The list is still running. The author, who was "
   "working at a particle physics laboratory at the time, has since been knighted.",

   "The document specified hyperlinks. That was the innovation. Everything else — the browser, "
   "the search engine, the shop, the argument, the video — was somebody else's idea, applied to "
   "a system that had only ever been a way of referring to documents by name.",

   "The web was designed to be read. It is, at time of writing, watched. Nobody involved "
   "considers this a failure of the original plan; it is more that the plan did not have a "
   "column for it.",
   ],
  featured=True,
  photo="A BROWSER WINDOW. THIS IS A NEWSPAPER PHOTOGRAPH OF SOMETHING THAT DOES NOT LOOK LIKE A PHOTOGRAPH.",
  byline=5,
  comments=[(21, "ten years. i remember when a page took four minutes and you had to sit there and watch the letters appear. we called that 'the internet' and we were right.", None),
            (45, "i was 11 in 1991. my dad set up a dial-up account so that i could email my cousin in australia. it took nine minutes. we did it every sunday.", None),
            (23, "the web was designed to be read and now there is a page that makes my computer fan run like a jet. i do not say this to be ungrateful. i say it to be accurate.", None),
            (13, "as someone who was on that list in 1991: it wasn't twenty people, it was four, and two of us were arguing about the font", None),
            (37, "the man who invented it gave a speech last year in which he apologised for the success. i thought that was very funny and very sad in equal measure.", None),
           ]),

A((2001, 9, 11), "world",
  "Hijackers Destroy Two Aircraft And A Third Collides With A Field In Pennsylvania",
  "At 8:47 this morning four aircraft were taken over in the space of forty minutes. Two "
  "flights and the World Trade Center no longer exist. The third flight hit a field in "
  "Pennsylvania. This is the whole story as this newspaper knows it at four in the afternoon, "
  "and it will be wrong.",
  ["NEW YORK, September 11 -- Four passenger aircraft were hijacked this morning. Two struck "
   "the World Trade Center towers in lower Manhattan; both towers collapsed within two hours. A "
   "third struck the Pentagon. A fourth, which departed from Newark, struck a field in "
   "Somers County, Pennsylvania at 10:03 a.m.",

   "The number of people confirmed dead is not yet known and is certainly higher than the "
   "number announced so far. Emergency services in New York are asking people who are uninjured "
   "to stop walking toward the site and to go home, because more people are dying in the "
   "streets around it than in the buildings.",

   "This newspaper has been publishing since a horse-powered press and has never had to report "
   "anything like this. We will keep publishing. We do not yet know what to publish, and we "
   "will be reporting what we know and what we do not, and we will mark the difference.",

   "All three networks have gone to continuous coverage without commercials. There is no "
   "advertisement on the air right now. Please stay in front of a television.",
   ],
  featured=True,
  photo="THE PHOTOGRAPH ABOVE THIS ARTICLE WAS TAKEN FROM A HELICOPTER AND MAY NOT BE ACCURATE",
  quote="We do not yet know what to publish, and we will be reporting what we know and what we do not, and we will mark the difference.",
  comments=[(2, "my cousin was on the first flight out of Boston. i am not going to write anything else here. please just know that i know.", None),
            (7, "i keep refreshing. it has been eight hours. i have not moved from this chair. i do not think i have blinked.", None),
            (6, "they are saying it was planned. i was there in 1993 when the first one was tried and stopped and everyone said that couldn't happen here. so plan on it.", None),
            (49, "i would like everyone reading this to know that the person who sat next to me at a bar in March is missing and i am very frightened and i do not know who to tell.", None),
            (21, "the whole world is in my kitchen. my mother made tea. it is very quiet apart from the television.", None),
            (37, "i am an old man and i have seen a lot and i have never seen this. nobody in this thread has seen this. that is why i am writing in it at 3am.", None),
            (26, "posting this so it exists somewhere in case, i don't know, in case somebody needs it in twenty years. 8:47. two towers. a field in pennsylvania. that's all.", None),
            (17, "MY COUSIN WAS ON THE FLIGHT THAT DID NOT LAND. HE IS ALIVE. HE CALLED HIS MOTHER FROM THE STREET. I AM NOT OKAY BUT I AM ALIVE.", None),
            (33, "i have never agreed with this site more than i do right now and i have never read it more carefully. every word is true and marked true. that's all you can ask.", None),
            (41, "the reporter said they'd mark the difference between what they know and what they don't. this thread is the only place I've read that distinction maintained for eleven hours. thank you.", None),
           ]),

A((2001, 10, 7), "world",
  "Ground Forces Enter Afghanistan",
  "Television shows the aircraft. The order of events does not, and it will be a long time "
  "before anyone agrees on it: this newspaper has been unable to confirm who is in the "
  "mountains, in what number, under whose command.",
  ["KABUL, October 7 -- Aircraft began striking targets in Afghanistan on Sunday night, and "
   "American and British troops entered the country overnight, according to officials in both "
   "countries.",
   "There is no useful way to describe the size or shape of what has arrived. The government "
   "has said \"thousands\". A senior official in the region, speaking on condition of anonymity, "
   "said \"some\".",
   ],
  byline=1),

A((2001, 10, 20), "world",
  "Letters Containing Powder Sent To Senators And Newsrooms",
  "Twenty-two people have been diagnosed with cutaneous anthrax after opening letters sent to "
  "two senators and two news organisations. Investigators have said repeatedly that the public "
  "risk is low, and have also said repeatedly that they do not know how many letters are out "
  "there.",
  ["WASHINGTON, October 20 -- Investigators confirmed today that anthrax has been found in "
   "mail sent to at least four senators and two media organisations, and that 22 people have "
   "developed cutaneous infections, three of them postal workers.",
   "\"There is no danger to the general public,\" said an FBI spokesman on Wednesday, and on "
   "Thursday the same spokesman said that the department was \"sensitive to any perception of "
   "an ongoing threat.\"",
   ],
  byline=2),

A((2001, 11, 16), "culture",
  "The Boy With The Glasses Is Released, And A Generation Loses Its Nerve",
  "Eleven years of newspaper speculation ended tonight with the release of the first Harry "
  "Potter film, three years after the first book and four before the last of the series was "
  "written. Children who were seven when they queued for it are now eighteen and have queued "
  "again.",
  ["LONDON, November 16 -- The first Harry Potter film opened in cinemas this evening, nearly "
   "four years after the first novel was published and at the end of a queue of children who had "
   "been assembling outside cinemas since the afternoon, dressed as their characters, for a "
   "film they had not been permitted to see for eleven years of their lives.",

   "The adaptation is reported to be faithful, which in this context is a strange compliment. "
   "It runs 152 minutes, which in this context is a scandal.",
   ],
  photo="THE PREMIERE. THE CHILDREN ARE BLURRED. THE PARENTS ARE BLURRED. EVERYBODY IS BLURRED."),

A((2001, 12, 2), "business",
  "Enron Files For Bankruptcy, Its Share Price Having Been $90 In August",
  "The seventh-largest company in the United States has admitted, in a document filed in "
  "Manhattan this morning, that it does not know how much money it has, that it will not be "
  "able to pay its debts, and that somebody has been signing its name.",
  ["NEW YORK, December 2 -- Enron Corporation filed for Chapter 11 bankruptcy protection this "
   "morning, one day after disclosing that it owed more than $10 billion to creditors and "
   "stockholders, and sixteen months after its shares reached a high of $90.",

   "The filing of 6,000 pages is the largest bankruptcy in American history and has been "
   "summarised, by a bankruptcy lawyer who has read it, as \"the first time a company has "
   "filed documents showing that it did not know what it owned.\"",

   "Its former chief executive has not been charged with anything. Its accountants have. The "
   "share price fell from $90 to twenty-six cents.",
   ],
  featured=True,
  photo="THE FILING. 6,000 PAGES. THIS PHOTOGRAPH SHOWS 400 OF THEM.",
  comments=[(28, "I WORKED THERE. that's all I'm going to say. we all knew. the ones of us who said so had jobs for two more years and then we didn't.", None),
            (41, "six thousand pages and the part that matters is that nobody in charge understood the thing they were signing. that's not fraud that's a failure of education and we did that too.", None),
            (12, "the shares were ninety dollars in august. i bought at ninety. i would like the person who told me 'the analysts love it' to come out. gently.", None),
            (49, "this is the beginning of something. there's going to be more of these. every company that tells you it understands itself is going to be wrong about this.", None),
            (9, "my 401k is mostly this. I have a degree in accounting. I want that noted somewhere.", None),
            (20, "posting the correct play, which is that nothing is correct, and I have checked, and then a graphic", None),
           ]),

A((2001, 12, 7), "world",
  "The Government Of Afghanistan Is Finished, Over Radio",
  "The last capital of the last government to be recognised by almost nobody left the city "
  "somewhere between Thursday night and Saturday. The new authorities have no army, no money, "
  "and, at time of writing, the telephone.",
  ["KABUL, December 7 -- Forces opposed to the government took control of the capital this "
   "morning. The government had lost the city on Wednesday and had not attempted to retake it, "
   "it said, because it no longer had the fuel.",

   "A convoy of senior government officials left the city on Thursday evening in four cars and "
   "was reported to have crossed into Pakistan on Friday. It is not known which of them, if any, "
   "remains in the country.",
   ],
  byline=1,
  photo="THE PALACE. WE ARE NOT GOING TO EXPLAIN THE PHOTOGRAPH FURTHER."),
]

ARTICLES += [

# ---- 2002 -----------------------------------------------------------------

A((2002, 1, 1), "business",
  "Twelve Countries Begin Using A Currency Nobody Has To Learn",
  "Notes and coins in twelve currencies were issued to 300 million people on the first of the "
  "month. Accounts are still being opened in old currencies in three countries. The "
  "conversion rate was fixed years ago and will not be adjusted for as long as the exchange "
  "rate holds, which is a sentence with conditions in it.",
  ["FRANKFURT, January 1 -- The euro entered circulation in twelve countries this morning, "
   "replacing national currencies with a note that shows a window and a bridge, neither of "
   "which is in the country that issued it.",

   "The European Central Bank has assured citizens that the changeover will be 'an entirely "
   "ordinary experience,' a phrase which has been repeated approximately eleven thousand times "
   "since January 1999 and which everybody still finds slightly sinister.",
   ],
  byline=3,
  photo="THE NOTES. THE BRIDGE IS IN ROUEN AND WE HAVE CHECKED."),

A((2002, 1, 28), "politics",
  "President Names An Axis In A Speech To Congress",
  "In a speech to Congress, the president identified three governments as constituting an "
  "axis of evil and asked for congressional authorisation to use force against two of them. The "
  "third was mentioned in the same breath and then not referred to again for seven minutes.",
  ["WASHINGTON, January 28 -- In his State of the Union address this evening, the president "
   "described Iran, Iraq and North Korea as \"an axis of evil,\" and asked Congress for "
   "authority to use military force against Iraq.",

   "The phrase was prepared in the White House. Officials declined to say who had chosen it, "
   "which is itself a sentence that would not have been necessary in 1999.",
   ],
  featured=True, byline=1,
  photo="THE HOUSE, DURING THE ADDRESS. EVERYBODY IS STANDING UP EXCEPT THE PEOPLE WHO HAVE DISCOVERED THEY NEED TO SIT DOWN.",
  comments=[(4, "i'm an english teacher and i have been asked about this phrase by four students this week. one of them thought it was from a film.", None),
            (22, "an axis of evil. that's what we're voting on. my grandfather fought an actual axis and he would have opinions and I am not printing all of them.", None),
            (12, "if you all think this means there's going to be a war then you haven't been paying attention, and if you think it means there won't be one, you also haven't.", None),
            (35, "when my father said the exact same kind of thing in 1939 he was quoting somebody in Berlin. that's all I'll say. that's all I'll say.", None),
            (47, "SPEECHLESS. ACTUALLY NO. NOT SPEECHLESS. GO READ THE TRANSCRIPT, THERE ARE THREE PARAGRAPHS IN IT ABOUT THINGS THAT WEREN'T EVEN ASKED ABOUT.", None),
           ]),

A((2002, 2, 8), "sports",
  "Winter Olympics Open In Salt Lake City With A Debt And A Prayer",
  "The Games were awarded to a city that did not have the venues, which built them in eighteen "
  "months, and the athletes' village, which was not finished. Both facts are likely to appear "
  "in the first paragraph of every retrospective written about this sport.",
  ["SALT LAKE CITY, February 8 -- The Winter Olympics opened this evening in a city that built "
   "its ski jump in eighteen months and hosted an athletics event in a field.",

   "There are 2,500 athletes from 78 nations competing in 15 sports over 17 days. The United "
   "States and Germany have between them won more medals than the rest of the world put "
   "together, which is a sentence that will be repeated in every language in this building.",
   ],
  photo="THE CEREMONY. THE FIRE WENT OUT TWICE, WHICH EVERYBODY NOTICED."),

A((2002, 3, 12), "business",
  "Argentina's Currency Is Unpegged In Four Days And The Country Stops",
  "The largest default in the history of an industrial economy began with a government "
  "announcement that it would not repay three debts, and finished with people walking home "
  "because there were no buses.",
  ["BUENOS AIRES, March 12 -- Argentina's currency entered a fourth consecutive day of steep "
   "decline this afternoon, having fallen by roughly a quarter in a week, and the government "
   "imposed banking restrictions on Saturday after depositors began withdrawing dollars faster "
   "than the central bank could count them.",

   "The government has said the economy will recover. It has said this before. The number of "
   "unemployment has passed thirty percent, which the government has confirmed by releasing "
   "the figure itself.",
   ],
  photo="A BANK. THE QUEUE WAS LONG ENOUGH TO WRAP AROUND IT."),

A((2002, 4, 1), "politics",
  "Netherlands Becomes First Country To Legalise Same-Sex Marriage",
  "The law takes effect on 1 April. It permits two people of the same sex to marry, with "
  "consequences for inheritance, adoption and parental authority, all of which were debated for "
  "eleven minutes because the coalition agreement covered them in a single sentence.",
  ["AMSTERDAM, April 1 -- The Netherlands today became the first country in the world to legalise "
   "marriage between two people of the same sex, a decision taken by 109 votes to 33.",

   "The new law applies to couples who apply within a year of the wedding having taken place; "
   "retroactive marriages will not be recognised before April 2004.",
   ],
  byline=1,
  photo="THE BUILDING. THE FLAG OUTSIDE WAS NOT THERE YESTERDAY AND WE TOOK THIS FROM THE OTHER SIDE OF THE STREET."),

A((2002, 4, 20), "tech",
  "Microsoft Unveils A Tablet Computer With A Pen",
  "The device costs about $1,800, weighs 3 pounds, runs for three hours, and has been "
  "demonstrated at three trade shows by four manufacturers who are competing to see who can "
  "ship the least capable version first.",
  ["SEATTLE, April 20 -- Microsoft today showed a tablet computer with a pressure-sensitive "
   "screen, a stylus, and no keyboard, and said it would ship in June in the form of a "
   "convertible notebook sold by several manufacturers.",

   "At the demonstration the machine was asked to find a restaurant. It found a restaurant. The "
   "restaurant was in Seattle. Everybody in the room had been to Seattle.",
   ],
  photo="THE DEVICE. THE PEN IS ACTUALLY INCLUDED. THIS HAS NEVER BEEN TRUE BEFORE."),

A((2002, 5, 13), "world",
  "Gunmen Storm Indian Parliament Building During State Visit",
  "Four gunmen entered the Indian parliament complex in New Delhi during a state visit, "
  "killing at least eight people before being killed. Twelve members of parliament were in the "
  "building, most of whom were sitting in an office rather than in the chamber, which is why "
  "the building has been redesigned.",
  ["NEW DELHI, May 13 -- Gunmen stormed the Indian parliament building this afternoon during a "
   "visit by the president of Pakistan, killing at least eight people before being killed "
   "themselves by members of the parliamentary security detail.",

   "The security arrangements for the visit placed the visiting party in a separate building "
   "across a courtyard, which is generally felt to have been the whole difficulty.",
   ],
  photo="THE COURTYARD. EVERYBODY AGREES THAT THIS IS WHERE THE PROBLEM IS."),

A((2002, 5, 31), "sports",
  "World Cup Opens In Japan And South Korea With 32 Teams From Six Continents",
  "It is the first tournament to be staged in two countries and the first in which the hosts "
  "have to travel like everybody else. It will also be remembered for a striker who arrived "
  "having played 23 minutes of professional football before the tournament.",
  ["TOKYO, May 31 -- The World Cup opened this evening with a match between the hosts, in a "
   "stadium built with a public subsidy that the government has since published, and one team "
   "that is two countries.",
   "Thirty-two teams from six confederations are playing 64 matches over 31 days. The final is "
   "on 30 June.",
   ],
  photo="THE STADIUM. IT IS CLEAN. SOME OF THEM ARE CLEAN."),

A((2002, 6, 30), "sports",
  "Brazil Wins The World Cup, And Ronaldo Finishes The Match He Would Not Start",
  "Brazil beat Germany 2-0 in Yokohama. The winning goals were both headers, both set up by a "
  "man with nine assists in the tournament, one of which is still being argued about, three "
  "years later, by everybody.",
  ["YOKOHAMA, June 30 -- Brazil won the World Cup this evening, beating Germany 2-0 with two "
   "second-half headers in a final that the winning team's manager spent the closing minutes of "
   "conceding to his assistant was a mistake.",
   "The tournament's top scorer was a Brazilian striker who played 23 minutes of professional "
   "football before the competition began, having been injured for two years, and who is now "
   "the most expensive player in the history of the sport.",
   ],
  featured=True,
  photo="THE CUP. IT WAS NEW. IT WAS NOT SCRATCHED, WHICH PEOPLE NOTED AT THE TIME."),

A((2002, 7, 21), "business",
  "WorldCom Files For Bankruptcy, Having Declared $3.8 Billion Of Expenses As Revenue",
  "The second-largest telecommunications company in the United States has admitted that it "
  "capitalised ordinary line costs as capital spending for six quarters, which is the sort of "
  "thing that is done once, by a person, on purpose.",
  ["WASHINGTON, July 21 -- WorldCom filed for Chapter 11 bankruptcy protection tonight, "
   "revealing as it did so that $3.8 billion of ordinary operating expenses had been recorded "
   "as capital investment over six quarters, inflating reported profits and the share price "
   "during the period.",

   "The former chief executive remains chief executive. The board, which approved the treatment "
   "of the expenses, has been described in a filing by one of its own members as \"not having "
   "understood what it was approving,\" a phrase that is very likely to be repeated for years.",
   ],
  featured=True, byline=3,
  photo="THE HEADQUARTERS IN CLINTON, MISSISSIPPI. THE PARKING LOT HAS 28,000 SPACES."),

A((2002, 7, 14), "sports",
  "Commonwealth Games Open In Manchester With A Barge That Has To Be Wheeled Into Place",
  "The opening ceremony moved 2,000 competitors up the River Irwell on a barge which, three "
  "days before, was still being assembled in a warehouse approximately eleven miles away. "
  "This is standard practice in the host city and is not normally considered remarkable.",
  ["MANCHESTER, July 14 -- The Commonwealth Games opened this evening with a ceremony on the "
   "River Irwell in which 2,000 competitors were carried past the city on a barge that had to "
   "be floated up the canal under its own power three days ago, having been built in a "
   "warehouse.",

   "Nineteen nations and four territories are competing. Fiji, at this competition, won more "
   "golds per head of population than any other country on earth.",
   ],
  byline=5, photo="THE BARGE."),

A((2002, 8, 20), "world",
  "A Quiet Month, Which We Have Decided To Cover At Length",
  "No wars started. No cabinets fell. No animals escaped. This newspaper has nonetheless "
  "attempted to establish what people did in August, and can report that the answer is: they "
  "went on holiday, and they argued about it.",
  ["LONDON, August 20 -- August has been, by any measure this desk can construct, a month in "
   "which nothing happened, and we have therefore decided to spend the front page on the "
   "subject of holidays.",

   "Bookings to Mediterranean destinations are reported to be down by around eight percent on "
   "last year, a fall that the industry attributes to the weather and to the introduction of a "
   "single carrier who has been undercutting everybody since April.",
   ],
  byline=2,
  photo="A BEACH. OR SOMETHING LIKE ONE."),

A((2002, 10, 12), "world",
  "Bombings In Bali Kill Over Two Hundred, Most Of Them Foreigners",
  "A series of bombs went off in a tourist district in Bali, killing at least 202 people, most "
  "of them foreign nationals, many of them Australian. The bombings were almost certainly the "
  "work of an organisation that had rejected peace in Indonesia two years earlier.",
  ["DENPASAR, Indonesia, October 12 -- Three bombs detonated within a few minutes of each other "
   "in a tourist district of Bali on Saturday night, killing at least 202 people and injuring "
   "around 200 more, most of them foreign nationals.",

   "Almost all of the dead were tourists. Foreign governments have advised their citizens "
   "against travel to the region, which will do considerable damage to an economy already "
   "dependent on a single season.",
   ],
  featured=True, byline=1,
  photo="THE STREET. THE MEMORIAL WAS THERE WITHIN TWELVE HOURS AND WAS NEEDED WITHIN FOUR.",
  comments=[(38, "my mother and father were on that street. they are alive. my mother's hand is broken and my father will not talk about it and I will not ask him to.", None),
            (21, "i keep thinking about the twenty-two australian dead and how the number 202 makes everybody else a rounding error in the papers. i have a friend in perth who lost two.", None),
            (7, "the government keeps saying 'tourists' on the news and keeps saying 'OUR citizens' when one of them dies. it is the same word and i would like it changed.", None),
            (45, "it's a beautiful place. that's the thing nobody says. it's a beautiful place and this happened in it and both of those are now permanent.", None),
           ]),

A((2002, 10, 23), "world",
  "Gunmen Take Over Moscow Theatre, Hold 700, Threaten",
  "Chechen militants seized a Moscow theatre and held more than seven hundred people for three "
  "days, threatening to detonate bombs if the government withdrew its troops from Chechnya. On "
  "the fourth day the government introduced gas through the ventilation, and everyone in the "
  "building died.",
  ["MOSCOW, October 26 -- The hostage crisis in the Dubrovka theatre entered its fourth day this "
   "morning with the government refusing the demand that Russian troops withdraw from Chechnya, "
   "and the hostages still inside the building, where medical supplies began running out "
   "yesterday.",
   "There have been reports throughout the week that a large number of the hostages are not "
   "hostages but participants. Nobody has explained how that would be arranged, and at least one "
   "official has said privately that it is a way of describing a situation nobody wants to "
   "define.",
   ],
  photo="THE THEATRE. IT IS A THEATRE. THAT IS WHAT MADE IT USABLE."),

A((2002, 11, 23), "sports",
  "Cricket World Cup Ends Level, For The First Time In Its History",
  "The final was drawn on the fourth day in the same city where the semi-final was drawn, in "
  "front of 35,000 people, and the two captains shook hands in front of them.",
  ["COLOMBO, November 23 -- The Cricket World Cup ended this evening as it has never ended "
   "before: tied, with the two captains shaking hands and the trophy presented to both nations, "
   "after the fourth consecutive day of rain in a city that has a 2,000-year record of not "
   "raining in November.",
   ],
  byline=5, photo="THE GROUND. THE DRAWN MATCH WAS NOT THE FIRST DRAWN MATCH; IT WAS THE FIRST DRAWN FINAL."),

A((2002, 12, 20), "business",
  "The Year Ends With The Economy Explaining Itself",
  "Three separate governments have issued statements this month saying that the difficult "
  "times are over. The statements were made within eleven days of each other, by countries with "
  "very different economies, which suggests that either the analysis is genuinely universal or "
  "that governments in difficulty all sound alike when they read from prepared remarks.",
  ["LONDON, December 20 -- The year has ended with the markets up, the world's largest "
   "bankruptcy behind us, an oil-producing economy in the fourth year of a dispute it has been "
   "losing, and three central banks cutting rates on the same week for reasons that do not "
   "entirely coincide.",
   "Analysts expect next year to be better. Analysts expected this year to be better.",
   ],
  byline=3, photo="THE YEAR. THERE IS NO PHOTOGRAPH OF A YEAR."),

# ---- 2003 -----------------------------------------------------------------

A((2003, 2, 1), "space",
  "Shuttle Breaks Apart Returning To Earth, Killing All Seven",
  "Columbia disintegrated over central Texas at 9:00 this morning, sixteen minutes after "
  "re-entry began. The cause was determined within days: a piece of insulating foam had struck "
  "the left wing during launch, and nobody at any of the three organisations involved had "
  "reported seeing it do so.",
  ["HOUSTON, February 1 -- The space shuttle Columbia was lost this morning during re-entry, "
   "killing all seven crew. Contact with the vehicle was lost at 8:59 a.m. Central Texas, where "
   "debris was found across a wide area, watched it come apart.",

   "Investigators established within a week that the damage was caused on launch by a fragment "
   "of insulating foam from the external tank, and that the event was visible on camera to "
   "several hundred people, in several government agencies, on the morning of the launch.",

   "The organisation that manages the vehicle has been criticised for a culture in which such "
   "observations were not escalated, a criticism which the organisation's own internal report "
   "accepted six years later in language that nobody believed could be written by an "
   "organisation which had not changed.",
   ],
  featured=True, byline=5,
  photo="NO PHOTOGRAPH. NO PHOTOGRAPH EXISTS. THERE IS A DIAGRAM IN THE REPORT AND IT IS NOT A PHOTOGRAPH.",
  quote="There was a video. There was a video the whole time, in several buildings, on the morning of the launch.",
  comments=[(9, "I am an engineer and I want to say something that will get me shouted at: the failure was not the foam. the failure was that the person who saw it had no way to be believed and knew it.", None),
            (23, "seven people. I have worked in an organisation that had the same reporting structure. I want to be precise: the foam did not kill them. the silence killed them.", None),
            (46, "my son watched it on his birthday. he was nine. he asked me why nobody said anything. i did not have an answer that a nine year old could use.", None),
            (41, "the report says 'normalisation of deviance'. that's engineers' language for everyone agreeing to agree with each other. i have been that person at a job.", None),
            (26, "eight years later they still send flowers to the crew. I have seen it. it is on the anniversary, every year, at a ceremony at the base, in front of people who were not on the vehicle.", None),
           ]),

A((2003, 3, 15), "world",
  "A New Disease Is Being Tracked From Hong Kong To Toronto",
  "A respiratory illness has killed at least five people and hospitalised hundreds, and by "
  "this week it has been confirmed in eleven countries. It has no name yet. It is being "
  "referred to by a number, which is how these things always start and how they rarely end.",
  ["TORONTO, March 15 -- Canadian health officials have confirmed eleven cases of an atypical "
   "pneumonia among staff at a hospital, four of them fatal, and the cluster is now understood "
   "to be part of a wider outbreak that began in southern China in November.",

   "The World Health Organization has issued a global alert for the first time in its history "
   "using its new mechanism for exactly this circumstance.",
   ],
  featured=True, byline=4,
  photo="A HOSPITAL CORRIDOR. THE PHOTOGRAPHER WOULD NOT GIVE US THE ONE WE WANTED."),

A((2003, 3, 20), "world",
  "Invasion Of Iraq Begins With 2,000 Strikes And A 33-Hour Ultimatum",
  "Air strikes against Iraqi command, control and communications facilities began at about "
  "9:34pm local time, and were followed within hours by roughly 2,000 further strikes and then "
  "by ground forces crossing the border. The address to the nation lasted eleven minutes.",
  ["BAGHDAD, March 20 -- American and British forces entered Iraq overnight after a final "
   "ultimatum expired at 8:17pm local time, having given the Iraqi government more than 48 "
   "hours in which to leave.",

   "Early morning television showed traffic on a bridge into the city and a supermarket that "
   "appears to have been open throughout. The government has not been located.",
   ],
  byline=1,
  photo="BAGHDAD AT NIGHT FROM A HELICOPTER. SOME OF THESE IMAGES ARE THE SAME IMAGE."),

A((2003, 4, 9), "world",
  "Baghdad Falls. A Statue Comes Down. A Channel Becomes The Most Famous In The World.",
  "Coalition forces entered the capital this morning. Crowds toppled a statue in a square in "
  "Firdos, where a man stood on a plinth and spoke. That is all that happened, and it is "
  "enough that the square is now named after him.",
  ["BAGHDAD, April 9 -- Coalition forces took control of Baghdad this morning after fighting "
   "in the streets overnight. The government has surrendered.",

   "In the early afternoon thousands of people gathered in Firdos Square and pushed a statue of "
   "the former president off its plinth with ropes. American television carried the video "
   "continuously for six hours.",
   ],
  byline=1,
  photo="THE PLAZA. THE CAMERA WAS ON THE PALACE ROOF. THE AUDIO WAS FROM SOMEBODY ELSE'S CAMERA."),

A((2003, 5, 1), "politics",
  "The President Declares Major Combat Operations In Iraq Complete",
  "The speech was delivered on a carrier deck with the aircraft behind him at a specific "
  "angle. The text referred to 1936, the year of a different war, in a sentence that has been "
  "quoted, out of context, by people who are right about the reference and wrong about the "
  "meaning.",
  ["WASHINGTON, May 1 -- In an address from the deck of an aircraft carrier in the Persian "
   "Gulf, the president declared that \"major combat operations in Iraq have ended\" and "
   "referred to the coming day as the moment \"the transition from conflict to peace.\"",
   "The mission continues. The administration has said this. The mission also continues.",
   ],
  featured=True, byline=1,
  photo="THE DECK. IT IS GREEN. THE SPEECH WAS GIVEN FROM THE FRONT."),

A((2003, 6, 21), "space",
  "A Privately Built Spacecraft Makes Its First Powered Flight",
  "A prototype powered for 60 seconds at an altitude of 60,000 feet, reached a speed of "
  "Mach 2, and flew inverted. The company is a one-man outfit with a converted sailplane and a "
  "stacked carbon-fibre tank, and it has won a prize for building a spacecraft that leaves the "
  "atmosphere and comes back.",
  ["MOJAVE, California, June 21 -- A privately funded rocket flew for 60 seconds this "
   "afternoon, reaching Mach 2 and turning over, and its pilot was subsequently suspended for "
   "opening the throttle during a test he was not supposed to be conducting.",

   "The flight was watched by a few hundred people in a car park. There were no news "
   "helicopters. The company's administrator, asked for a comment, said: \"We are just a small "
   "privately funded experimental space company and we have no comment.\"",
   ],
  featured=True, byline=5,
  photo="THE ROCKET. IT IS 10 METRES AND IT WORKED."),

A((2003, 7, 9), "world",
  "The Month The Word 'Regime' Started Doing A Lot Of Work",
  "Iraq has been governed for four months and the news from it has been almost entirely of "
  "three kinds: a list, a denial, and a photograph. This page has attempted all three and has "
  "not, on balance, managed to do any of them better than the networks.",
  ["BAGHDAD, July 9 -- Four months after the end of major combat operations, the coalition "
   "authority has established a governing council, a utilities ministry, and a telephone "
   "network with intermittent service.",

   "Power is available for approximately half the day in about a third of the country. The "
   "figure has been disputed by both the authority and the ministry, each of which claims a "
   "different number, and neither of which has published the method.",
   ],
  byline=2,
  photo="A POWER PLANT THAT WAS NOT DAMAGED AND HAS NO POWER."),

A((2003, 8, 14), "world",
  "Power Cut Takes Down Ohio And Ontario And Northeast For Nine Days",
  "A failure in a small Ohio woodland took out a large part of the northeastern United States "
  "and eastern Ontario in a matter of seconds, and it took four days for everybody to agree "
  "what had happened. A third of the affected population was still without power a week later.",
  ["CLEVELAND, August 14 -- A power failure affecting ten million people in Ohio, Michigan, "
   "Ontario and Pennsylvania began at approximately 4:11pm local time on Thursday afternoon and "
   "was not fully resolved this week.",

   "The initial cause — an untrimmed growth of trees contacting a line — has been confirmed, "
   "along with a second question, still open, about why a distant part of the grid did not pick "
   "up the load.",
   ],
  featured=True, byline=1,
  photo="A SUBSTATION. EVERYONE AGREES THAT NOBODY CHECKED THE TREES IN THE SUMMER."),

A((2003, 9, 11), "world",
  "Two Years On, The News Of Iraq Is A Number Of People Who Are Not In The Pictures",
  "It is the second anniversary of the invasion. The television anniversary programmes have been "
  "made by three of the four networks, who have all used archive footage of the toppling of "
  "the statue, and none of whom has used any of it.",
  ["BAGHDAD, September 11 -- Two years after the invasion, reconstruction figures released "
   "this week put the number of schools rebuilt at approximately 30, against a pre-war figure "
   "of 45,000.",
   "The interim constitution, which was to have been adopted in 2003, has been delayed. The "
   "elections have been scheduled. The security forces numbers have been released in one "
   "month and not in another.",
   ],
  byline=1,
  photo="THE PLAZA, TWO YEARS ON. SOMEBODY HAS PUT A SATELLITE DISH ON THE PLINTH."),

A((2003, 10, 20), "internet",
  "Blogs Hit One Hundred Thousand And Nobody Agrees What To Call Them",
  "The number of weblogs tracked by the search engines passed six figures this month, "
  "according to one widely quoted estimate, whose methodology involves counting the ones that "
  "have been updated in the last thirty days. The number of people reading them is unknown and "
  "is obviously large.",
  ["SAN FRANCISCO, October 20 -- The number of weblogs tracked by a search engine in the United "
   "States passed 100,000 this month, the company said, and the number has been growing by "
   "roughly a third per quarter.",

   "The first well-known weblog, which began in July 1999 as a single page of links, is now "
   "run by two people with a server in California and is read, by its own figures, in eleven "
   "countries more than in the one it was written in.",
   ],
  byline=5,
  photo="A ROOM WITH A COMPUTER IN IT. THAT IS WHERE THIS IS NOW HAPPENING."),

A((2003, 11, 15), "internet",
  "The Websites That Are Only On The Websites",
  "A phenomenon has begun in which a large number of the pages on the internet exist to be "
  "linked to by other pages on the internet, and cannot be found by searching for what they "
  "say. One of them has been nominated for an award. This is not a criticism; it is an "
  "observation with a funny shape.",
  ["LONDON, November 15 -- Research published this month estimates that the number of "
   "weblogs that have never been linked to from anywhere is zero, and the number that are "
   "linked to almost exclusively from within their own circle is around four million.",
   "One of the linked-to sites has been nominated for a journalism award by a jury that found "
   "it online by accident.",
   ],
  photo="A LOOP OF ARROWS POINTING AT EACH OTHER. WE HAD TO DRAW IT."),

A((2003, 12, 20), "world",
  "A Quiet Year That Was Not Quiet",
  "It is customary for this newspaper to run an end-of-year piece in which the desk lists what "
  "it got wrong. This year's entry is longer than usual, and begins with the words: we were "
  "briefed, in August, that the year would be quieter.",
  ["LONDON, December 20 -- The year is ending. The following things happened, and this desk "
   "reported them, and in a number of cases reported them late or not at all:",

   "A shuttle came apart. A virus moved between airports by people who were not sick. A war was "
   "declared to be over from a carrier deck and continued. Four million people lost power for "
   "nine days. An invasion produced a constitution, later, in a different country, and that is "
   "a joke this desk is not going to make.",

   "We got the causes wrong on the blackout for four days. We were wrong about the timing of "
   "the constitution for a year. In September we published a photograph of a demonstration we "
   "had described as small.",
   ],
  byline=4,
  photo="THIS PAGE. IT IS THE ONLY THING WE ARE CERTAIN ABOUT."),

# ---- 2004 -----------------------------------------------------------------

A((2004, 1, 20), "internet",
  "The Web Is Thirteen And It Has A Memory Problem",
  "For thirteen years people have been told that the web does not forget, which has turned out "
  "to be approximately correct: it remembers everything except who asked, why they asked, and "
  "whether they wanted it.",
  ["LONDON, January 20 -- Thirteen years after the first web page, a study published this week "
   "found that the average page published in 1996 can still be reached at its original address "
   "in one case in three.",

   "Of the pages that have survived, a substantial proportion now contain material whose "
   "author is unknown, whose date is unknown, and whose purpose has been forgotten by everyone "
   "including the people who made it.",
   ],
  byline=5, photo="A SERVER ROOM. NONE OF THESE ROOMS CONTAIN A MEMORY."),

A((2004, 2, 1), "world",
  "Six Seconds Of Video, And The Argument That Followed",
  "A television network's meteorologist was fired this week for calling a school shooting's "
  "location 'not in a tornado zone'. Her union says she was not given the opportunity to "
  "retract the statement. The network says she was not given the opportunity to retract it "
  "because she made it six seconds before the broadcast ended.",
  ["WASHINGTON, February 1 -- The National Weather Service has reinstated a meteorologist "
   "suspended last month after she said, on live television, that a school shooting in "
   "Minnesota had occurred 'in a town that is not in a tornado zone'.",

   "The Service has referred the case to an administrative judge. The union has called the "
   "firing 'an abdication of the First Amendment by a federal agency', a phrase which several "
   "former agency employees described in interviews as 'exactly the kind of sentence we are "
   "paid not to write'.",
   ],
  byline=1, photo="A WEATHER MAP. THE WEATHER WAS NOT THE SUBJECT OF THIS ARTICLE."),

A((2004, 3, 11), "world",
  "Ten Bombs On Four Trains In Madrid, And A Government That Blames Somebody Else",
  "Three trains derailed within an hour across four stations in Madrid on the morning of "
  "March 11th, killing 191 people, almost all of them commuters. Within three days the "
  "government had attributed the attack to an organisation involved in the invasion of Iraq, "
  "and had withdrawn the troops that had been scheduled to leave.",
  ["MADRID, March 11 -- Four commuter trains were bombed within an hour of each other this "
   "morning in Madrid, killing at least 191 people, and almost all of the dead were on their "
   "way to work.",

   "The government has blamed an organisation responsible for bombings in Iraq and has "
   "suspended a plan to withdraw remaining troops from that country. The organisation has "
   "denied responsibility, as it has denied responsibility in every previous instance.",
   ],
  featured=True, byline=1,
  photo="AVE. DE LOS PASEOS. IT IS AN ORDINARY STREET WITH AN ORDINARY STATION UNDER IT.",
  comments=[(7, "i'm from madrid. my sister was on the ato. i am not going to describe what it was like. i want to say one thing: the whole city was told it was our fault within a day. that was the worst part.", None),
            (25, "it is the third time in twenty years a country has been blamed for an attack by somebody who could not have done it, and every time it worked for about a week.", None),
            (33, "the international section of this paper has been very careful about that attribution for three days and I would like everyone here to notice that.", None),
            (38, "three trains. the third one is the one that keeps me up. the first two had already happened when it left. somebody got on it anyway. everybody got on it anyway.", None),
           ]),

A((2004, 5, 5), "world",
  "Photographs Of Prisoners Published On A Page Of A Newspaper Of The Country That Took Them",
  "The images were taken eighteen months ago in a prison in Iraq by a soldier on a camera, "
  "given to an organisation, and published on the front page of a British newspaper on "
  "Wednesday. The paper's editor has been suspended pending an inquiry. The photographs won "
  "that day's circulation figures and are now the most reproduced images in the world.",
  ["LONDON, May 5 -- The Guardian today published a page of photographs showing the "
   "indiscriminate treatment of Iraqi detainees by British soldiers in 2002. The images had been "
   "provided by a soldier who photographed them, and who has since been arrested and charged.",
   "The newspaper's editor has been suspended while an external inquiry examines the "
   "publication decision. The Ministry of Defence has described the images as staged and has "
   "produced no evidence for that.",
   ],
  featured=True, byline=4,
  photo="THE PAGE. IT IS ON THE RIGHT. WE ARE NOT GOING TO DESCRIBE IT HERE.",
  comments=[(41, "the editor made a decision that will be argued about for twenty years and that might have cost this soldier his liberty. both of those are true at the same time and i refuse to pick.", None),
            (12, "the MOD said staged and then produced nothing. that is not a rebuttal. that is a sentence people say when they have nothing and the cameras are rolling.", None),
            (7, "he was 21. the soldier. he carried the camera for a year before he did the thing and then he handed it over and now he's in a cell. i cannot make this make sense.", None),
            (28, "i have been subscribed to this paper for eleven years and i want to say the word I am going to say: they got it right, and it cost them, and that is the entire job.", None),
            (49, "whatever you think about the war, this is what it does. it happens in a building four hours away from the press conference. that's all this comment is.", None),
           ]),

A((2004, 5, 12), "internet",
  "A Search Engine Is Being Sued By The People It Found",
  "A group of doctors has sued a search engine for displaying their names next to a website "
  "they say is fraudulent, and the search engine has responded by offering to display the "
  "judgement. Both sides have said the case is about something else. It is not about something "
  "else.",
  ["CHICAGO, May 12 -- A group of physicians have filed suit against the world's largest search "
   "engine, arguing that its results page displayed their names beside a website selling "
   "prescription medication without a licence, causing their patients to be harmed.",
   "The company said in a statement that it \"provides links to information and is not "
   "responsible for the content of the sites to which it links\", a defence which has been "
   "adopted by roughly every company in the industry.",
   ],
  byline=5, photo="A COURT BUILDING. NEITHER PARTY WILL USE A PHOTOGRAPH OF THE OTHER."),

A((2004, 6, 13), "world",
  "European Elections Deliver A Parliament Of Five Blocs",
  "Turnout across the union was 45.6 per cent, down by six points and, by some estimates, low "
  "enough to make the result of any given count statistically interesting. Turnout was lowest "
  "in the countries with the most to complain about, which was also true of the previous "
  "election.",
  ["BRUSSELS, June 13 -- Voting in the European parliamentary election ended last night across "
   "twenty-five member states with a turnout of 45.6 per cent, the lowest recorded since the "
   "elections began in 1979.",
   "The centre-right parties won the most seats and did not win a majority, a result which took "
   "nine weeks and one weekend of negotiating in Brussels to produce a government.",
   ],
  byline=1, photo="THE PARLIAMENT. WE WENT IN AND THEY LET US TAKE A PICTURE."),

A((2004, 7, 15), "politics",
  "Nobody Is Going To Win This One And Everybody Knows It",
  "The incumbent and the challenger have both said publicly that the election will be close, "
  "which is a sentence that men say when they believe it and a sentence that incumbents say "
  "when they do not. This desk has covered four of these and has been wrong about three.",
  ["WASHINGTON, July 15 -- With the election now eleven months away, the polling has settled "
   "into a permanent tie, and both campaigns have begun explaining that their candidate is "
   "actually winning.",
   "One of the two has begun wearing a hat.",
   ],
  byline=1, photo="A HAT. WE WOULD NOT USE A PICTURE OF THE HAT."),

A((2004, 8, 19), "business",
  "Search Engine Files For IPO, Is Valued At More Than Ford And General Motors",
  "The offering was priced at $85 a share on Wednesday night and was oversubscribed more than "
  "ten times before it opened. The company has 160 employees and says it has turned a profit "
  "for four consecutive quarters, which was not widely expected, including by the company.",
  ["MOUNTAIN VIEW, August 19 -- Google, a company founded in a garage in 1998 and incorporated "
   "in 2001, became publicly traded this morning at a valuation of more than $23 billion.",

   "The offering was priced at $85, raised $1.67 billion, and traded up 100 per cent by the "
   "close. It is the largest initial public offering in the history of the internet and the "
   "fourth largest in American history.",
   ],
  featured=True, byline=3,
  photo="THE TRADING FLOOR IN SAN FRANCISCO. THE IPO WAS IN NEW YORK."),

A((2004, 8, 30), "politics",
  "The Republican Convention Nominates A Governor",
  "The convention nominated a sitting governor of Texas on its first night, which was planned. "
  "The speech that followed lasted twenty-two minutes and was interrupted nine times by "
  "applause, which was also planned, and which he asked for by name from four delegations.",
  ["NEW YORK, August 30 -- The Republican National Convention nominated Governor George W. Bush "
   "for president this evening, in a session that lasted seventeen minutes because the "
   "candidate's arrival was timed to the minute and the film about him was two minutes shorter "
   "than it had been at the last convention.",
   "The platform, adopted without debate, runs to eleven pages and contains four sentences that "
   "the delegate floor considered controversial and which were, in the end, adopted.",
   ],
  byline=1, photo="THE FLOOR. THE SIGNS ARE PROPAGANDA AND THE CONVENTION KNOWS IT."),

A((2004, 9, 20), "world",
  "Two And A Half Years Of Iraq, In One Paragraph That Took Nineteen Seconds To Say",
  "A report by the inspector general of the occupation's reconstruction effort has concluded "
  "that of $18 billion intended to go back into the country, a substantial amount cannot be "
  "traced, that some was spent on a system of tracking, and that some of what was spent on "
  "the tracking system was not.",
  ["BAGHDAD, September 20 -- The inspector general for the reconstruction of Iraq said today "
   "that the office could not account for tens of thousands of files relating to the "
   "reconstruction programme, and that the absence of those files had itself cost money.",
   "He said he had asked for the files in 2003 and had been told for a year that they were "
   "coming.",
   ],
  byline=1, photo="A FILING CABINET. THIS IS NOT A METAPHOR, IT IS A DRAWING OF ONE."),

A((2004, 10, 5), "internet",
  "The Websites That Paid For Themselves With Their Own Readers",
  "Search-engine advertising revenue has overtaken the sale of books in the United States, by "
  "some estimates, in a decade. The comparison is unfair and everybody keeps making it, which "
  "is itself the story: a number of people who could not have got the number in 1994 are now "
  "getting it.",
  ["MENLO PARK, October 5 -- Advertising revenue at the largest internet search company will "
   "exceed $3 billion for the year, according to documents filed this week, putting it ahead of "
   "the entire American book retail market.",

   "The company also disclosed, in the same filing, that a significant number of its searches "
   "are for the same thing, and that it knows what that thing is, and will not say.",
   ],
  byline=5, photo="A BILLBOARD. IT IS EMPTY. WE HAVE DECIDED NOT TO PUT AN ADVERTISEMENT IN A STORY ABOUT ADVERTISEMENTS."),

A((2004, 11, 3), "politics",
  "Incumbent Re-elected After A Recount, In A Race Decided In Ohio",
  "The president won his own state by about 30,000 votes and the election by about 2.7 million. "
  "The margin in Ohio has now been certified, confirmed, recalculated, re-confirmed and "
  "published, in that order, four times. The other candidate conceded on the Wednesday after "
  "the last count.",
  ["WASHINGTON, November 3 -- President Bush was re-elected last night after a contest that "
   "was decided by a margin of approximately 2.7 million votes nationally, and by about 30,000 "
   "in Ohio.",
   "The counting of Ohio's provisional ballots took twelve days after the election and has been "
   "the subject of two lawsuits, one withdrawn and one pending.",
   ],
  featured=True, byline=1,
  photo="THE MAP. WE DO NOT PUBLISH THE MAP."),

A((2004, 11, 20), "world",
  "The Occupation, In One Year, In One Number",
  "Iraq's interim constitution has been approved by referendum and is to be ratified next "
  "year. The deadline for a constitution drafted and approved by an elected assembly has been "
  "met. This is a genuine achievement and the numbers attached to it are not reassuring, and "
  "both of those things are true and appear in the same sentence in the same paragraph.",
  ["BAGHDAD, November 20 -- Voters in Iraq approved an interim constitution this month by a "
   "turnout of about 58 per cent on a day when polling stations in several provinces were "
   "attacked, which turnout estimates have adjusted for.",
   "Direct deaths among coalition personnel in Iraq since March 2003 now stand at more than "
   "3,200, the vast majority from hostile action rather than accident, which is a sentence that "
   "would have been considered extraordinary before 2001 and is now merely the running total.",
   ],
  byline=1, photo="A POLLING STATION. THE CAMERA WAS NOT PERMITTED INSIDE."),

A((2004, 12, 26), "world",
  "An Earthquake In The Indian Ocean Generates A Wave And Then A Day Of News",
  "A magnitude 9.1 undersea earthquake off the west coast of Sumatra generated a tsunami that "
  "reached the coast of twelve countries within hours. Deaths so far are in excess of 100,000, "
  "which makes this the deadliest natural disaster in recorded history, and the figure is still "
  "rising.",
  ["BANDA ACEH, Indonesia, December 26 -- A massive undersea earthquake struck off the west "
   "coast of Sumatra early this morning, generating a series of waves that struck the coasts of "
   "Indonesia, Sri Lanka, Thailand, India, Bangladesh, Myanmar, Malaysia, Somalia, Tanzania, "
   "Kenya and Seychelles.",
   "Reports of deaths in Aceh province and in northern and western Thailand are in the tens of "
   "thousands. There is no final figure and there will not be one for weeks.",
   "The cause was an undersea earthquake on a plate boundary that everybody knew about, at a "
   "location that everybody on earth has agreed is capable of producing precisely this, which "
   "is the sentence that this desk has been waiting thirty years to be able to write and now "
   "regrets having written.",
   ],
  featured=True, byline=1,
  photo="THE COAST. THIS IS THE ONLY PHOTOGRAPH THAT WAS TAKEN FROM A HELICOPTER.",
  quote="There is no final figure and there will not be one for weeks.",
  comments=[(43, "my aunt is in the bandy. the hotel is in the bandy. i have read the same news on this page every day for four days because it is the only place i have read anything at all.", None),
            (9, "i am a structural engineer. i want to say one technical thing and then stop: the warning system worked in eleven countries. the people who died on the beaches had been told. this is not a comfort. it is the finding.", None),
            (21, "these comments are full of people who knew somebody. i am one of them. i am not going to say any more than that here and i am sorry for the noise.", None),
            (25, "every time. every single time somebody says 'there is no final figure' and means it as reassurance. it is not reassurance. it is the only honest sentence available.", None),
            (37, "i have been reading this paper for forty years. i have read it for obituaries and stock tips and football. i have never read it like this. please put the date at the top in a big font.", None),
            (6, "they are reporting this while it is happening. that is the whole reason to have a newspaper. that is the thing you do and this is what it looks like.", None),
           ]),

A((2002, 9, 3), "world",
  "The Biggest Environmental Meeting Since Rio Ends With A Full Room Of Politicians And No "
  "Binding Text",
  "Ten years after the Earth Summit, 60,000 people came to Johannesburg, which is the largest "
  "number of human beings that has ever met to discuss water. They agreed to a plan, several "
  "times, and left with a piece of paper that one of the delegations described in the press "
  "room as 'the most expensive meeting in the history of the planet, and we agreed to less "
  "than we already had'.",
  ["JOHANNESBURG, September 3 -- The World Summit on Sustainable Development ended this evening "
   "with a declaration signed by more than 100 governments, four of which recorded "
   "interpretations attached to their signatures, as is traditional and as was done in Rio in "
   "1992.",

   "The summit's own website, published in June, described water as 'the most important "
   "environmental issue of our time', a phrase which was used eleven times in three days by "
   "delegations that had no water policy.",

   "Between June 2000 and June 2002, two billion people in Asia and Africa gained access to "
   "improved water sources. The summit's headline number is that this progress should double by "
   "2015. The summit did not produce a mechanism for that, and said so, in a paragraph on page "
   "114 that reporters did not find until the following morning.",
   ],
  byline=5,
  photo="THE HALL. IT TOOK EIGHT YEARS TO BUILD AND WILL BE TAKEN DOWN ON TUESDAY."),

A((2003, 1, 20), "space",
  "Shuttle Finally Launches After Four Scrubs, To A Crowd That Has Learned Not To Leave",
  "Columbia left the pad on its third attempt of the week carrying a new external tank, a "
  "new crew escape system and approximately two and a half billion dollars of changes made "
  "since the last flight. Nobody in the press corps has said the word 'gremlin' out loud since "
  "Thursday.",
  ["CAPE CANAVERAL, January 16 -- The space shuttle Columbia launched this afternoon at 2:04pm "
   "EST on the third attempt of the week, carrying seven astronauts and 16 days of experiments "
   "to the international space station.",

   "The vehicle has been redesigned since the last flight, including the tank, the main "
   "engines, the landing gear and a hatch that has been moved from the side of the crew "
   "module to the roof specifically so that an astronaut can open it while wearing a pressure "
   "suit.",

   "The shuttle is scheduled to return on February 1.",
   ],
  byline=5,
  photo="THE PAD, ELEVEN DAYS AGO."),

A((2004, 4, 22), "world",
  "Everyone Has A Number And No Two Numbers Agree",
  "The number of dead in Iraq has been estimated between roughly 10,000 and 100,000 for "
  "eighteen months. Both numbers have been given at press conferences by officials of "
  "governments that do not disagree about the war, which means the disagreement is not "
  "political, or at least not only political.",
  ["LONDON, April 22 -- A coalition spokesman this week used a figure of between "
   "10,000 and 100,000 for deaths among Iraqi civilians since March 2003, a range he "
   "described as conservative and which has been quoted since as though it were a "
   "single figure.",

   "The methodology behind the low end counts documented hospital admissions. The methodology "
   "behind the high end extrapolates from capture rates in comparable conflicts. Both methods "
   "are standard in the field and neither is designed to survive being printed next to the "
   "other one.",

   "The British Ministry of Defence is understood to hold a mid-range figure which it has not "
   "published, on the grounds that the confidence interval is too wide to be useful to the "
   "public, a phrase this desk has heard used in three other contexts this year and which "
   "in each case preceded a refusal to publish the document.",
   ],
  byline=1,
  featured=True,
  photo="A HOSPITAL ENTRANCE. THE NUMBER OF PEOPLE GOING IN IS NOT THE NUMBER OF PEOPLE COMING OUT."),
]


# ---------------------------------------------------------------------------
# 6. THE COMMENT ENGINE
#     Bodies are drawn from the pool above and dealt out to threads so that a
#     comment you read on the tsunami page does not turn up under the euro.
# ---------------------------------------------------------------------------

SECTION_TAGS = {
    "world": ["war", "tragic", "politics", "truth"],
    "politics": ["politics", "war", "truth", "conspiracy"],
    "tech": ["tech", "internet", "nostalgia"],
    "business": ["business", "tech", "politics"],
    "space": ["space", "truth", "nostalgia"],
    "culture": ["culture", "nostalgia", "nostalgia2", "nostalgia3"],
    "sports": ["sports", "sports2", "silly"],
    "internet": ["internet", "tech", "nostalgia"],
}

# which sort of person writes which sort of comment
TONE_FOR = {
    "shouty": ["shouty", "screamer", "loud", "angry"],
    "screamer": ["screamer", "shouty", "loud", "angry"],
    "loud": ["loud", "shouty", "newish"],
    "angry": ["angry", "shouty", "denial"],
    "pro": ["pro", "expert", "practical"],
    "expert": ["expert", "pro", "tech"],
    "practical": ["practical", "pro"],
    "relative": ["relative", "kind", "sad"],
    "kind": ["kind", "relative", "sad"],
    "truth": ["truth", "expert", "mod"],
    "conspiracy": ["conspiracy", "odd"],
    "new": ["new", "newish"],
    "newish": ["newish", "new"],
    "anon": ["anon", "new", "newish"],
    "quiet": ["quiet", "retired", "sad"],
    "sad": ["sad", "lonely", "quiet"],
    "nostalgia": ["nostalgia", "nostalgia2", "nostalgia3", "retired"],
    "nostalgia2": ["nostalgia2", "nostalgia3", "nostalgia", "retired"],
    "nostalgia3": ["nostalgia3", "nostalgia2", "nostalgia"],
    "mod": ["mod"],
    "spam": ["spam", "new"],
    "odd": ["odd", "cats", "quiet"],
    "cats": ["cats", "odd"],
    "sports": ["sports", "sports2"],
    "sports2": ["sports2", "sports"],
    "retired": ["retired", "nostalgia3", "quiet"],
    "anxious": ["anxious", "kind"],
    "foreign": ["foreign", "nostalgia"],
    "silly": ["silly", "cats", "odd"],
    "lonely": ["lonely", "sad", "quiet"],
    "newsjunkie": ["new", "newish", "new"],
    "philosophical": ["quiet", "lonely", "nostalgia"],
    "consolation": ["quiet", "kind", "sad"],
}

USED_BODY = {}
USED_PERSON = {}


def pick_people(n, prefer, seed):
    """n distinct commenters, preferring the personalities that fit `prefer`."""
    want = []
    for tone in prefer:
        want.extend(TONE_FOR.get(tone, []))
    scored = []
    for i, p in enumerate(PEOPLE):
        fit = want.index(p[4]) if p[4] in want else len(want) + 4
        used = USED_PERSON.get(i, 0)
        scored.append((fit + used * 0.8, i))
    scored.sort()
    out = []
    for _, i in scored:
        if i in out:
            continue
        out.append(i)
        USED_PERSON[i] = USED_PERSON.get(i, 0) + 1
        if len(out) == n:
            break
    return out


def initials(name):
    parts = [p for p in name.replace("_", " ").split() if p]
    if not parts:
        return "?"
    return (parts[0][0] + (parts[-1][0] if len(parts) > 1 else "")).upper()


def assign_comments(a, index):
    """Build the thread for one article."""
    thread = []
    for who, text, quote in a["comments"]:
        if isinstance(who, int):
            p = PEOPLE[who]
        else:
            p = next((x for x in PEOPLE if x[0].lower() == str(who).lower()), PEOPLE[13])
        thread.append({"person": p, "text": text, "quote": quote, "badge": None})

    want_total = 9 if a["featured"] else 6
    tags = SECTION_TAGS.get(a["section"], [])
    pool = []
    for i, (tag, text) in enumerate(COMMENTS):
        if tag not in tags:
            continue
        pool.append((USED_BODY.get(i, 0), i, tag, text))
    pool.sort()
    chosen = []
    for _, i, tag, text in pool:
        if len(chosen) >= want_total - len(thread):
            break
        if USED_BODY.get(i, 0) > 3:
            continue
        chosen.append((i, tag, text))
        USED_BODY[i] = USED_BODY.get(i, 0) + 1

    people = pick_people(max(0, want_total - len(thread)),
                         [t for i, t, _ in chosen] + tags, index)
    for k, (i, tag, text) in enumerate(chosen):
        p = PEOPLE[people[k % len(people)]] if people else PEOPLE[13]
        quote = None
        if k % 4 == 3 and thread:
            src = thread[-1]["text"]
            quote = src[:110] + ("..." if len(src) > 110 else "")
        elif k % 5 == 2:
            quote = a["headline"]
        badge = None
        if tag == "spam":
            badge = ("OFF-TOPIC", "off")
        elif tag == "mod" and k % 2:
            badge = ("MODERATOR", "lock")
        thread.append({"person": p, "text": text, "quote": quote, "badge": badge})

    # shuffle a little, but keep the first hand-written comment on top
    head = thread[:len(a["comments"])]
    tail = thread[len(a["comments"]):]
    tail.sort(key=lambda c: c["person"][0])
    thread = head + tail

    # thread length, which is always bigger than the article
    fake = 41 + (index * 37) % 320 + (60 if a["featured"] else 0)
    return thread, max(fake, len(thread) + 3)


# ---------------------------------------------------------------------------
# 7. RENDERING
# ---------------------------------------------------------------------------

def slug(a):
    words = "".join(c if c.isalnum() else " " for c in a["headline"]).lower().split()
    stop = {"the", "a", "an", "and", "of", "in", "on", "to", "is", "are", "as", "at", "by", "it"}
    words = [w for w in words if w not in stop][:6]
    return "news-%04d-%02d-%02d-%s.html" % (a["date"][0], a["date"][1], a["date"][2],
                                          "-".join(words))


def esc(s):
    s = str(s)
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


def render_comment(c, n, article_id):
    name, joined, posts, loc, tone, colour = c["person"]
    when = ["2 minutes later", "an hour later", "same afternoon", "that evening",
            "the next morning", "the following day", "two days later", "a week later"][n % 8]
    rating = 3 + ((n * 13 + len(name)) % 84)
    return """    <div class="cm-item" id="c%d">
      <div class="cm-top"><span class="cm-rate">&#9650;%d</span>
        <span class="cm-av" style="background:%s">%s</span>
        <span class="cm-name">%s</span>%s
        &nbsp;<span class="gray">Joined: %s</span> &middot; <span class="gray">Posts: %s</span>
        &middot; <span class="gray">%s</span> &middot; <span class="gray">%s</span></div>
      <div class="cm-body">%s<div>%s</div>
        <div class="tiny gray" style="margin-top:4px">[ <a href="#" onclick="quoteComment('c%d','%s');return false;">quote this</a> ]
          &middot; [ <a href="#cm-form">reply</a> ]</div>
      </div>
    </div>""" % (
        n, rating, colour, esc(initials(name)), esc(name),
        (' <span class="cm-badge %s">%s</span>' % (c["badge"][1], c["badge"][0])) if c["badge"] else "",
        esc(joined), esc(posts), esc(loc), esc(when),
        ('<div class="cm-quote"><b>%s wrote:</b><br>%s</div>' % (esc(name), esc(c["quote"])))
        if c["quote"] else "",
        esc(c["text"]), n, esc(name))


def article_page(a, index, thread, fake_count):
    byname, bydesk = REPORTERS[a["byline"] % len(REPORTERS)]
    y, m, d = a["date"]
    paras = "\n".join("      <p>%s</p>" % p for p in a["body"])
    photo = ""
    if a["photo"]:
        photo = ('      <div class="nw-photo">%s<br><span class="tiny">( FILE PHOTO )</span></div>\n'
                 '      <div class="nw-cap">%s</div>\n' % (esc(a["photo"]), esc(a["photo"])))
    quote = ('      <div class="nw-quote">%s</div>\n' % esc(a["quote"])) if a["quote"] else ""
    comments = "\n".join(render_comment(c, i, slug(a)) for i, c in enumerate(thread))
    related = [x for x in ARTICLES if x["section"] == a["section"] and x is not a][:4]
    rel = ""
    if related:
        rel = ('      <div class="nw-related"><b>MORE FROM ' +
               dict(SECTIONS)[a["section"]] + ':</b><br>' +
               " &middot; ".join('<a href="%s">%s</a>' % (slug(x), esc(x["headline"])) for x in related) +
               '</div>\n')
    page = slug(a)
    body = """<div style="font-size:11px"><a href="news.html">FUNNYNEWS</a> &raquo;
        <a href="news.html#s-%s">%s</a> &raquo; <span class="gray">%s</span></div>

  <div class="nw-head">%s<span class="nw-date">%s &middot; %s</span></div>
  <div class="nw-deck">%s</div>
  <div class="nw-meta">FUNNYNEWS &middot; %s &middot; %s &middot;
      <a href="#cm-form">POST A COMMENT</a></div>
%s%s      <div class="nw-body">
%s      </div>
%s
  <div class="tiny gray" style="margin-top:10px">
    Corrections: none so far. Published items are never corrected, they are replaced,
    and the replacement keeps the original in the archive, where nobody will look for it.</div>

  <div class="cm-head" id="cm-here">COMMENTS (%d) &mdash; showing the %d that survived moderation</div>
  <div id="cm-mine"></div>
%s
  <div class="cm-form" id="cm-form">
    <b>POST A COMMENT</b>
    <p class="tiny gray" style="margin:4px 0">Be the 413th person to have an opinion about
    this. Everything you post here is saved on <b>your</b> computer only, which means the
    conversation you are having is a conversation with yourself. That is, on reflection, the
    only kind this website has ever had.</p>
    <div style="margin-bottom:4px"><input id="cm-name" size="24" maxlength="24" value="Anonymous Coward">
      <span class="tiny gray">&nbsp;your name, or don't, honestly</span></div>
    <textarea id="cm-text" rows="4" placeholder="type your comment. quote someone if you're replying to them."></textarea>
    <div style="margin-top:5px">
      <button class="btn2000" id="cm-go">&#9654; POST IT</button>
      <button class="btn2000" id="cm-clear">CLEAR MY COMMENTS FROM THIS PAGE</button>
      <span class="tiny gray" style="margin-left:6px">no accounts. no email. no newsletter. 2004.</span>
    </div>
  </div>
  <div class="tiny gray" style="margin-top:6px">
    House rules, posted since the beginning and enforced by one person:
    be the kind of commenter who would be tolerable in person. do not correct people's grammar
    unless it is fun. no fonts larger than 11 pixels. this is not a newspaper. it is a
    website.
  </div>
""" % (a["section"], dict(SECTIONS)[a["section"]], esc(long_date(y, m, d)),
       esc(a["headline"]), esc(long_date(y, m, d).upper()),
       "%02d:%02d" % (7 + index % 12, (index * 7) % 60), esc(a["deck"]),
       esc(dict(SECTIONS)[a["section"]]), stamp(y, m, d, 7 + index % 12, (index * 7) % 60),
       photo, quote, paras, rel, fake_count, len(thread) + 1, comments)
    extra = NEWS_JS % {"id": page.replace(".html", "")}
    return page, body, extra


NEWS_JS = r"""
<script>
/* the comment box. it saves to your own computer, which is the only database
   this website has ever had, on any page, ever. */
(function () {
  var KEY = "funnysite.news.comments";
  var AID = "%(id)s";
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function mine() {
    return load().filter(function (c) { return c.a === AID; });
  }
  function paint() {
    var box = document.getElementById("cm-mine");
    if (!box) return;
    var list = mine();
    if (!list.length) { box.innerHTML = ""; return; }
    box.innerHTML = list.map(function (c) {
      return '<div class="cm-item pending"><div class="cm-top">' +
        '<span class="cm-av" style="background:#8a6a00">' + esc(c.n.charAt(0).toUpperCase()) + '</span>' +
        '<span class="cm-name">' + esc(c.n) + '</span> ' +
        '<span class="cm-badge">PENDING MODERATION</span>' +
        ' &nbsp;<span class="gray">just now &middot; saved on your computer only</span></div>' +
        '<div class="cm-body">' +
        (c.q ? '<div class="cm-quote"><b>quoting:</b><br>' + esc(c.q) + '</div>' : "") +
        "<div>" + esc(c.t) + "</div>" +
        '<div class="tiny gray" style="margin-top:4px">[ <a href="#" onclick="delComment(ID)">delete this</a> ]</div></div></div>'
          .replace("ID", "'" + c.id + "'");
    }).join("");
  }
  window.delComment = function (id) {
    save(load().filter(function (c) { return c.id !== id; }));
    paint();
  };
  window.quoteComment = function (id, name) {
    var el = document.getElementById("cm-text");
    if (!el) return;
    var src = document.getElementById(id);
    var first = src ? (src.querySelector(".cm-body div") || {}).innerHTML : "";
    first = (first || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (first.length > 140) first = first.slice(0, 140) + "...";
    var q = "[QUOTING " + name + "]\n> " + first + "\n";
    el.value = el.value && el.value.indexOf(q) < 0 ? el.value + "\n" + q : (el.value || q);
    document.getElementById("cm-name").value = document.getElementById("cm-name").value || "Anonymous Coward";
    el.focus();
    document.getElementById("cm-form").scrollIntoView();
  };
  function boot() {
    paint();
    var go = document.getElementById("cm-go");
    if (go) go.addEventListener("click", function () {
      var t = document.getElementById("cm-text");
      var n = document.getElementById("cm-name");
      var text = (t.value || "").trim();
      if (!text) {
        alert("you clicked post with nothing in the box. everybody does this. everybody.");
        t.focus();
        return;
      }
      var quote = (text.match(/^\[QUOTING[^\]]*\]\s*>.*$/m) || [""])[0];
      var all = load();
      all.push({ id: "c" + Date.now(), a: AID, n: (n.value || "Anonymous Coward").trim(), t: text, q: quote });
      save(all);
      t.value = "";
      paint();
      if (FS && FS.unlock && !localStorage.getItem("funnysite.commented")) {
        try { localStorage.setItem("funnysite.commented", "1"); } catch (e) {}
        FS.unlock("comment-section", {
          say: "<b>you posted a comment.</b> on a newspaper that does not exist, about a " +
               "story that did, in a thread that nobody is reading except you. " +
               "that is the internet in miniature and I do not have a joke about it."
        });
        if (FS.rain) FS.rain("POSTED");
      }
    });
    var cl = document.getElementById("cm-clear");
    if (cl) cl.addEventListener("click", function () {
      save(load().filter(function (c) { return c.a !== AID; }));
      paint();
      alert("your comments on this story have been deleted. they were never published. " +
            "they were never going to be published. but they were yours.");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
</script>
"""


def front():
    """news.html -- the front page of the paper."""
    by_day = {}
    for a in ARTICLES:
        by_day.setdefault((a["date"][0], a["date"][1]), []).append(a)
    latest = ARTICLES[-1]
    lead = [a for a in ARTICLES if (a["date"][0], a["date"][1]) == (2001, 9)]
    lead = lead[0] if lead else latest

    def hl(a, i):
        y, m, d = a["date"]
        n = 41 + (i * 37) % 260
        return ('      <div class="nw-hl"><a href="%s">%s</a>'
                '<span class="nw-date">%s &middot; %d comments</span></div>'
                % (slug(a), esc(a["headline"]), esc(long_date(y, m, d).upper()), n))

    rows = []
    for (y, m) in sorted(by_day, reverse=True):
        arts = by_day[(y, m)]
        rows.append('        <tr><td class="mo" width="96" nowrap><a href="news-archive.html#%04d-%02d">'
                    '%s %d</a></td><td class="tiny gray" nowrap>%d stor%s</td></tr>'
                    % (y, m, MONTHS[m - 1].title()[:3], y, len(arts),
                       "y" if len(arts) == 1 else "ies"))

    front_page = """<div class="nw-wrap">
  <div class="nw-masthead"><b>FUNNYNEWS</b>
    <div class="tag">WIRE SERVICE &middot; EST. 1998 &middot; 24 HOURS, 0 EDITORS</div></div>
  <div class="nw-ticker">&#9679; BREAKING: the internet is still here. &nbsp;&middot;&nbsp;
    no plugins required. &nbsp;&middot;&nbsp; the paper is printed daily and read by 0 people
    &nbsp;&middot;&nbsp; corrections are made silently</div>
  <div class="nw-tabs"><span class="nw-tab">HEADLINES</span>%s
     <span class="tiny gray" style="float:right">ALL STORIES FROM JANUARY 2000</span></div>

  <div style="border:2px solid #2a4f8a;background:#fff;padding:8px;margin:6px 0">
    <div class="tiny" style="color:#2a4f8a;font-weight:bold">LEAD STORY &middot; FROM THE ARCHIVE</div>
    <div class="nw-head" style="margin:2px 0"><a href="%s">%s</a></div>
    <div class="nw-deck">%s</div>
    <div class="tiny gray">%s &middot; still the most commented page on this website
      &middot; <a href="%s">read it and then read the comments</a></div>
  </div>

  <div style="display:flex;gap:8px">
    <div style="flex:2;min-width:0">
      <div class="cm-head">THE LAST FEW DAYS</div>
      %s
      <div class="cm-head" style="margin-top:8px">2003, WHICH WAS MOSTLY THIS</div>
      %s
    </div>
    <div style="flex:1;min-width:0">
      <div class="cm-head">THE ARCHIVE</div>
      <div style="background:#fff;border:1px solid #999;border-top:0">
        <table width="100%%" cellpadding="2" cellspacing="0" class="nw-arch small">
%s
        </table>
      </div>
      <div class="tiny gray" style="margin-top:6px">one story a month, minimum. some months
      got four, and we did not have a good reason.</div>
      <div class="cm-head" style="margin-top:8px">THE DESK</div>
      <div style="background:#fff;border:1px solid #999;border-top:0;padding:5px" class="tiny">
        The stories here happened. The dates are right. Everything after the third paragraph is
        a joke, and one joke per story, which is more restraint than you would expect from
        this desk.<br><br>
        <a href="news-archive.html">EVERYTHING, BY MONTH &raquo;</a><br>
        <a href="news-rules.html">THE COMMENT RULES (2 OF THEM) &raquo;</a>
      </div>
    </div>
  </div>
</div>
""" % ("".join('<a href="news.html#s-%s">%s</a> ' % (k, v) for k, v in SECTIONS),
       slug(lead), esc(lead["headline"]), esc(lead["deck"]),
       esc(long_date(*lead["date"])), slug(lead),
       "\n".join(hl(a, i) for i, a in enumerate(reversed(ARTICLES[-8:]))),
       "\n".join(hl(a, i + 40) for i, a in enumerate(ARTICLES[-14:-8][::-1])),
       "\n".join(rows[:12]))
    return front_page


def archive_page():
    by_year = {}
    for a in ARTICLES:
        by_year.setdefault(a["date"][0], []).append(a)
    out = []
    for y in sorted(by_year, reverse=True):
        out.append('  <h2>%d <span class="tiny gray">(%d stories)</span></h2>' % (y, len(by_year[y])))
        out.append('  <table width="100%" cellpadding="2" cellspacing="0" class="bev small">')
        for a in sorted(by_year[y], key=lambda x: x["date"], reverse=True):
            yy, mm, dd = a["date"]
            out.append('    <tr><td width="120" class="mono nowrap">%s</td>'
                       '<td width="90" class="tiny gray">%s</td>'
                       '<td><a href="%s">%s</a></td>'
                       '<td width="90" class="tiny gray">%s</td></tr>'
                       % (long_date(yy, mm, dd), dict(SECTIONS)[a["section"]],
                          slug(a), esc(a["headline"]),
                          "&#9733; FEATURED" if a["featured"] else ""))
        out.append('  </table>')
    body = """<p class="note">Every story this desk has ever published, in the order it happened,
which is the only order any of it was any good in. Months with more than one story are months
when more than one thing happened, which was rare.</p>
""" + "\n".join(out) + """
<div class="tape" style="margin-top:12px">%(count)d STORIES &middot; 60 MONTHS &middot; 0 FACTORIES
  &middot; 100%% OF THE EVENTS ACTUALLY HAPPENED</div>
""" % {"count": len(ARTICLES)}
    return body


def rules_page():
    body = """<h2>THE COMMENT RULES</h2>
<p class="note">There are two of them and one of them is a joke. This page exists because the
real newspapers' comment rules are 4,000 words long and were written by lawyers in 1999, and
because a section that is mostly comments should at least be honest about its own rules.</p>

<div class="sunken" style="padding:8px">
<p><b>1.</b> &ldquo;Be the kind of person who would be tolerable in person.&rdquo;</p>
<p><b>2.</b> &ldquo;Do not correct people's grammar unless it is fun.&rdquo;</p>
<p style="font-size:11px;color:#555">and one actual technical rule: no fonts larger than 11
pixels. That is genuine. There was a 2003 incident and we do not discuss it.</p>
</div>

<h2>WHAT HAPPENS TO A COMMENT</h2>
<table width="100%" cellpadding="4" cellspacing="0" class="bev small">
  <tr class="titlebar"><td>OUTCOME</td><td>HOW MANY</td><td>WHY</td></tr>
  <tr class="bev-in"><td>published</td><td class="mono">7 to 9</td><td>the ones that were interesting</td></tr>
  <tr><td>marked OFF-TOPIC</td><td class="mono">some</td><td>about the font, or about the poster's politics</td></tr>
  <tr class="bev-in"><td>marked MODERATOR</td><td class="mono">some</td><td>they are the ones deleting the rest</td></tr>
  <tr><td>deleted</td><td class="mono">the rest</td><td>not our decision. the number of comments is not our decision either</td></tr>
</table>

<h2>THE COMMENTS ON THIS SITE ARE YOURS</h2>
<div class="sunken" style="padding:8px">
<p class="note" style="margin:0">Every comment box on this site writes to <b>your own browser</b>
and to nowhere else. Nobody reads them. There is no server, no account, and no way for the
comment you post at 2am to reach the article it is about, because it is stored on your hard
drive next to a cookie nobody wants.</p>
<p class="note" style="margin:6px 0 0 0">This is either the most honest comment section ever
built or the saddest one, depending on the day, and we genuinely do not know which.</p>
</div>
<div class="tape" style="margin-top:12px">TWO RULES &middot; ONE JOKE &middot; ZERO SERVER &middot; 100%% OF THE COMMENTS ARE STORED ON YOUR OWN COMPUTER</div>
"""
    return body


def main():
    written = []
    for i, a in enumerate(ARTICLES):
        thread, fake = assign_comments(a, i)
        fname, body, extra = article_page(a, i, thread, fake)
        out = chrome(a["headline"] + " - FUNNYNEWS - funnysite",
                     fname, NEWS_CSS + body, extra,
                     a["deck"][:150])
        with open(os.path.join(ROOT, fname), "w") as f:
            f.write(out)
        written.append(fname)
        print("wrote", fname)

    pages = [
        ("news.html", "FUNNYNEWS - funnysite",
         "a newspaper that did not exist, covering five years that did. 72 stories, "
         "every month, every one with a comment section.",
         NEWS_CSS + front()),
        ("news-archive.html", "THE ARCHIVE - FUNNYNEWS - funnysite",
         "every story, by month, in the order it happened.",
         NEWS_CSS + archive_page()),
        ("news-rules.html", "THE COMMENT RULES - FUNNYNEWS - funnysite",
         "two rules. one of them is a joke.",
         NEWS_CSS + rules_page()),
    ]
    for fname, title, desc, body in pages:
        with open(os.path.join(ROOT, fname), "w") as f:
            f.write(chrome(title, fname, body, "", desc))
        print("wrote", fname)

    print("%d news pages stamped. %d stories. %d comments published."
          % (len(written) + len(pages), len(ARTICLES),
             sum(len(t) for _, t in [(0, assign_comments(a, i)[0]) for i, a in enumerate(ARTICLES)])))


if __name__ == "__main__":
    main()
