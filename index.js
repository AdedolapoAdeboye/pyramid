import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, TextField, CssBaseline, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { openDatabase } from 'react-sqlite-hook';

// SQLite database setup
const sqliteDB = openDatabase('VotingAppDB', '1.0', 'Voting Database', 2 * 1024 * 1024);

sqliteDB.transaction(tx => {
  tx.executeSql('CREATE TABLE IF NOT EXISTS profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, dob TEXT, profilePicture TEXT, isVerified BOOLEAN)');
  tx.executeSql('CREATE TABLE IF NOT EXISTS votes (id INTEGER PRIMARY KEY AUTOINCREMENT, vote TEXT)');
  tx.executeSql('CREATE TABLE IF NOT EXISTS candidates (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)');
});

// Theme configuration
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
  },
});

// Navbar component
function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Voting App
        </Typography>
        <Button color="inherit" component={Link} to="/">Home</Button>
        <Button color="inherit" component={Link} to="/history">Vote History</Button>
        <Button color="inherit" component={Link} to="/profile">Profile</Button>
      </Toolbar>
    </AppBar>
  );
}

// Home component
function Home() {
  const [vote, setVote] = useState('');
  const [votes, setVotes] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    sqliteDB.transaction(tx => {
      tx.executeSql('SELECT * FROM candidates', [], (tx, results) => {
        const rows = results.rows;
        let candidatesArray = [];
        for (let i = 0; i < rows.length; i++) {
          candidatesArray.push(rows.item(i));
        }
        setCandidates(candidatesArray);
      });

      tx.executeSql('SELECT * FROM profiles WHERE id = 1', [], (tx, results) => {
        if (results.rows.length > 0) {
          setIsVerified(results.rows.item(0).isVerified === 1);
        }
      });

      tx.executeSql('SELECT * FROM votes', [], (tx, results) => {
        const rows = results.rows;
        let votesArray = [];
        for (let i = 0; i < rows.length; i++) {
          votesArray.push(rows.item(i));
        }
        setVotes(votesArray);
      });
    });
  }, []);

  const handleVote = () => {
    if (vote && isVerified) {
      sqliteDB.transaction(tx => {
        tx.executeSql('INSERT INTO votes (vote) VALUES (?)', [vote], () => {
          setVote('');
          setVotes([...votes, { vote }]);
        });
      });
    } else if (!isVerified) {
      alert('You must be verified to vote.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Cast Your Vote</Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>Candidate</InputLabel>
        <Select value={vote} onChange={(e) => setVote(e.target.value)}>
          {candidates.map((candidate, index) => (
            <MenuItem key={index} value={candidate.name}>{candidate.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" color="primary" onClick={handleVote}>Submit Vote</Button>
      <div style={{ marginTop: '20px' }}>
        <Typography variant="h6">Recent Votes</Typography>
        {votes.map((v, index) => (
          <Typography key={index}>{v.vote}</Typography>
        ))}
      </div>
    </div>
  );
}

// VoteHistory component
function VoteHistory() {
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    sqliteDB.transaction(tx => {
      tx.executeSql('SELECT * FROM votes', [], (tx, results) => {
        const rows = results.rows;
        let votesArray = [];
        for (let i = 0; i < rows.length; i++) {
          votesArray.push(rows.item(i));
        }
        setVotes(votesArray);
      });
    });
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Vote History</Typography>
      {votes.map((v, index) => (
        <Typography key={index}>{v.vote}</Typography>
      ))}
    </div>
  );
}

// Profile component
function Profile() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  useEffect(() => {
    sqliteDB.transaction(tx => {
      tx.executeSql('SELECT * FROM profiles WHERE id = 1', [], (tx, results) => {
        if (results.rows.length > 0) {
          const profile = results.rows.item(0);
          setName(profile.name);
          setDob(profile.dob);
          setProfilePicture(profile.profilePicture);
        }
      });
    });
  }, []);

  const handleProfileSave = () => {
    sqliteDB.transaction(tx => {
      tx.executeSql('INSERT OR REPLACE INTO profiles (id, name, dob, profilePicture, isVerified) VALUES (?, ?, ?, ?, ?)', [1, name, dob, profilePicture, 0], () => {
        alert('Profile saved!');
      });
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>User Profile</Typography>
      <TextField
        label="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Date of Birth"
        type="date"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="Profile Picture URL"
        value={profilePicture}
        onChange={(e) => setProfilePicture(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={handleProfileSave}>Save Profile</Button>
    </div>
  );
}

// Main App component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<VoteHistory />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
