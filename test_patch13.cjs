const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');

const tEffect = `// Load specific data when request selected
  useEffect(() => {
    if (selectedRequestId && view === "request_details") {
      setSelectedProductId(null); // Reset detail view when entering a request
      const loadDetails = async () => {`;
      
const rEffect = `// Load specific data when request selected
  useEffect(() => {
    if (selectedRequestId && view === "request_details") {
      setSelectedProductId(null); // Reset detail view when entering a request
      
      // FIX: Prevent flash of old data by clearing state before async load
      setProducts([]);
      setEditableProducts([]);
      setActions([]);

      const loadDetails = async () => {`;

if (c.includes(tEffect)) {
    c = c.replace(tEffect, rEffect);
    console.log("Successfully patched App.tsx");
} else {
    console.log("Could not find exact text, trying regex...");
    const regex = /\/\/ Load specific data when request selected[\s\S]*?setSelectedProductId\(null\); \/\/ Reset detail view when entering a request[\s\S]*?const loadDetails = async \(\) => {/;
    if (regex.test(c)) {
        c = c.replace(regex, `// Load specific data when request selected
  useEffect(() => {
    if (selectedRequestId && view === "request_details") {
      setSelectedProductId(null); // Reset detail view when entering a request
      
      // FIX: Prevent flash of old data by clearing state before async load
      setProducts([]);
      setEditableProducts([]);
      setActions([]);

      const loadDetails = async () => {`);
        console.log("Regex patch successful");
    } else {
        console.log("Regex patch failed too.");
    }
}

fs.writeFileSync('App.tsx', c, 'utf8');
