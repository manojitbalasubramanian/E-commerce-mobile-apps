import { execSync } from "child_process";

const DAYS_TO_BACKDATE = 90; // 3 months
const BRANCH_NAME = "rebuilt_history";

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fisher-Yates shuffle
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

function distributeHistory() {
  console.log('Fetching all project files...');
  // Get all files currently tracked by git
  const filesOutput = execSync('git ls-files').toString().trim();
  let files = filesOutput.split('\n').filter(Boolean);
  
  if (files.length === 0) {
    console.log('No files to process.');
    return;
  }

  // Shuffle files for random committing
  shuffle(files);

  const totalCommits = 90; // Approx 1 per day to keep things simpler
  const filesPerCommit = Math.ceil(files.length / totalCommits);
  
  console.log(`Creating orphan branch '${BRANCH_NAME}'...`);
  // Checkout new branch with no commit history
  execSync(`git checkout --orphan ${BRANCH_NAME}`);
  
  // Unstage everything
  execSync('git rm -rf --cached .');

  const today = new Date();
  
  console.log(`Committing ${files.length} files across ${totalCommits} days...`);
  
  for (let i = totalCommits; i > 0; i--) {
    const chunk = files.splice(0, filesPerCommit);
    if (chunk.length === 0) break;

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - i);
    targetDate.setHours(getRandomInt(9, 21), getRandomInt(0, 59), getRandomInt(0, 59));
    
    // Stage chunk of files
    for (const file of chunk) {
      try {
        execSync(`git add "${file}"`);
      } catch (e) {
        // file might have been deleted but still tracked in previous git ls-files if not careful
      }
    }

    const dateString = targetDate.toISOString();
    
    try {
      execSync(`git commit -m "chore: incrementally adding files"`, {
        env: {
          ...process.env,
          GIT_AUTHOR_DATE: dateString,
          GIT_COMMITTER_DATE: dateString,
        },
      });
      console.log(`Generated commit on ${dateString} containing ${chunk.length} files`);
    } catch (err) {
      console.error("Failed to make commit, perhaps no new files added.");
    }
  }
  
  console.log(`\n✅ Finished redistributing history onto branch: ${BRANCH_NAME}`);
}

distributeHistory();
