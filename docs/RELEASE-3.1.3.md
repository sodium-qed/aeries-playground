# Aeries Playground 3.1.3 prerelease

Select **Start grade testing**, then edit the percentage already shown on an assignment in table or card view. On an added hypothetical assignment, edit the percentage in its grade display. For example, **87.5%** on a 40-point assignment gives **35 / 40** and preserves the assignment's total and weight. If you change the **Score** total afterward, earned points recalculate while the percentage stays fixed. Editing earned points or raw marks switches the score to the unit you entered.

To test a range, turn on **Range** and choose **Percentage (%)** under **Bounds in**. A counted score of zero contributes to the grade, a blank score remains ungraded, and extra-credit percentages follow the course's score limits. Use a positive **Score** total. Four-point gradebooks use a fixed total of 4. Hypothetical scores and ranges stay local to Playground and never submit changes to Aeries. See the [Grade testing lab guide](https://github.com/sodium-qed/aeries-playground/blob/feature/grade-lab-percentage/docs/FEATURES.md#grade-testing-lab).

To install or update manually, open `aeries-playground.user.js` under **Assets**. Review the complete script and its privacy notes, then install it or replace the existing copy in your userscript manager. If it opens as plain text, paste the whole script, including its header, into the manager's editor and save. Keep one copy enabled and reload Aeries. See [manual update instructions](https://github.com/sodium-qed/aeries-playground/blob/feature/grade-lab-percentage/README.md#update-manually).

All 424 repository tests passed. The test suite uses fixture data. Live Aeries testing is pending.
