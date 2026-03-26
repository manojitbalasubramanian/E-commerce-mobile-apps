const { execSync } = require("child_process");
const fs = require("fs");

const DAYS_TO_BACKDATE = 90; // 3 months
const FILE_TO_MODIFY = "dummy_commit_history.txt";

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCommits() {
  const today = new Date();

  // Create or clear the dummy file
  fs.writeFileSync(FILE_TO_MODIFY, "Start of dummy history\n");

  let totalCommits = 0;

  for (let i = DAYS_TO_BACKDATE; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - i);

    // Pick a random number of commits for the day (e.g. 0 to 4)
    const commitsToday = getRandomInt(0, 4);

    for (let j = 0; j < commitsToday; j++) {
      const commitDate = new Date(targetDate);
      commitDate.setHours(
        getRandomInt(9, 21), // Between 9 AM and 9 PM
        getRandomInt(0, 59),
        getRandomInt(0, 59)
      );

      const dateString = commitDate.toISOString();

      try {
        fs.appendFileSync(FILE_TO_MODIFY, `Commit at ${dateString}\n`);
        execSync(`git add ${FILE_TO_MODIFY}`);

        // Commit with backdated environment variables
        execSync(`git commit -m "chore: project update"`, {
          env: {
            ...process.env,
            GIT_AUTHOR_DATE: dateString,
            GIT_COMMITTER_DATE: dateString,
          },
        });
        
        console.log(`Created commit for: ${dateString}`);
        totalCommits++;
      } catch (err) {
        console.error("Failed to make commit:", err.message);
      }
    }
  }
  console.log(`\n✅ Finished generating ${totalCommits} random commits over the past 3 months.`);
}

generateCommits();
