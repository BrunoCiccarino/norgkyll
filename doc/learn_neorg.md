<h1 align="center">
  <br>
  <a href="https://github.com/nvim-neorg/neorg">
    <img src="https://raw.githubusercontent.com/nvim-neorg/neorg/refs/heads/main/res/neorg.svg" width="600" height="400">
  </a>
  <br>
  Learn Neorg 
  <br>
</h1>

<p align="center"> 
Here in this session you will learn the basics of neorg so you can build your own blog/website using norg.
</p>

# Basic Markup

   Here is how you can do very basic markup. First you see it raw, then rendered:
   - `*bold*`
   - `/italic/`
   - `_underline_`
   - `-strikethrough-`
   - `!spoiler!`
   - `inline code` (Inline code is defined with backticks, I couldn't add it there because markdown processes it so I had to put this warning.)
   - `^superscript^`  (when nested into `subscript`, will highlight as an error)
   - `,subscript,`    (when nested into `superscript`, will highlight as an error)
   - `$f(x) = y$`     (see also {# Math})
   - `&variable&`     (see also {# Variables})
   - `%inline comment%`

  > [!WARNING]
  > We have a bug in the markups, do not use them in a list, inside a list.

### Heading

  We have 6 heading levels and they are defined with *, it has this syntax:

  * Heading level 1 <br>
  ** Heading level 2 <br>
  *** Heading level 3 <br>
  **** Heading level 4 <br>
  ***** Heading level 5 <br>
  ****** Heading level 6 <br>

### Unordered lists

    - Unordered list level 1
    -- Unordered list level 2
    --- Unordered list level 3
    ---- Unordered list level 4
    ----- Unordered list level 5
    ------ Unordered list level 6

### Ordered lists

    ~ Ordered list level 1
    ~~ Ordered list level 2
    ~~~ Ordered list level 3
    ~~~~ Ordered list level 4
    ~~~~~ Ordered list level 5
    ~~~~~~ Ordered list level 6

### Tasks

    - ( ) Undone -> not done yet
    - (x) Done -> done with that
    - (?) Needs further input

    - (!) Urgent -> high priority task
    - (+) Recurring task with children

    - (-) Pending -> currently in progress
    - (=) Task put on hold
    - (_) Task cancelled (put down)
