const fs = require('fs');
const file = 'App.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetIndex = content.indexOf('if (returnedLogs.length > 0 && returnedLogs[0].actor_id) {');
if (targetIndex !== -1) {
    const oldBlock = \if (returnedLogs.length > 0 && returnedLogs[0].actor_id) {
              const targetProfile = await db.fetchProfile(
                returnedLogs[0].actor_id
              );\;
    
    const newBlock = \const latestReturnerId = returnedLogs.length > 0 ? (returnedLogs[0].actor_id || returnedLogs[0].user_id) : null;
            if (latestReturnerId) {
              const targetProfile = await db.fetchProfile(
                latestReturnerId
              );\;
              
    content = content.replace(oldBlock, newBlock);
} else {
    console.log("Could not find actor_id if block");
}

const uiEndIndex = content.indexOf('setView("dashboard");\\n        } catch (e) {');
if (uiEndIndex !== -1) {
    const oldUiBlock = \const reqs = await db.fetchRequests();
        setRequests(reqs);
        // Products reloaded by effect when view changes or ID changes

        setView("dashboard");
      } catch (e) {\;
      
    const newUiBlock = \const reqs = await db.fetchRequests();
        setRequests(reqs);
        // Products reloaded by effect when view changes or ID changes
        
        alert("Corrections submitted! The assigned reviewer has been notified.");
        setView("dashboard");
      } catch (e) {\;
      
    content = content.replace(oldUiBlock, newUiBlock);
} else {
    console.log("Could not find end block");
}

fs.writeFileSync(file, content);
console.log("Success");
