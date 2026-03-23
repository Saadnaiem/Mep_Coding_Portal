const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf8');

const regexReviewActions = /\s*\{\/\* Action Buttons only for actionable users \*\/\}\s*\{isRequestActionable && \(\s*<Card\s+title="Review Actions"[\s\S]*?<\/Card>\s*\)\}/;
const reviewActionsMatch = content.match(regexReviewActions);

if (reviewActionsMatch) {
  const reviewActionsBlock = reviewActionsMatch[0];
  content = content.replace(regexReviewActions, '');

  const regexTarget = /(<\/Card>\s*\{\/\* Vendor Documents Card - Visible to all Staff and Vendors \*\/\})/;
  const targetMatch = content.match(regexTarget);

  if (targetMatch) {
    content = content.replace(targetMatch[1], "</Card>\n" + reviewActionsBlock + "\n              {/* Vendor Documents Card - Visible to all Staff and Vendors */}");
    fs.writeFileSync('App.tsx', content, 'utf8');
    console.log('Successfully moved Review Actions section!');
  } else {
    console.log('Target section not found.');
  }
} else {
  console.log('Review Actions section not found.');
}
