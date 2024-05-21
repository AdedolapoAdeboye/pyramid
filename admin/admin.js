import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, TextField, CssBaseline, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { openDatabase } from 'react-sqlite-hook';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';

// SQLite database setup
const sqliteDB = openDatabase('VotingAppDB', '1.0', 'Voting Database', 2 * 1024 * 1024);

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
          Admin App
        </Typography>
        <Button color="inherit" component={Link} to="/">Home</Button>
        <Button color="inherit" component={Link} to="/users">Verify Users</Button>
        <Button color="inherit" component={Link} to="/candidates">Manage Candidates</Button>
      </Toolbar>
    </AppBar>
  );
}

// VerifyUsers component
function VerifyUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    sqliteDB.transaction(tx => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, dob TEXT, profilePicture TEXT, isVerified BOOLEAN)');
      tx.executeSql('SELECT * FROM profiles', [], (tx, results) => {
        const rows = results.rows;
        let usersArray = [];
        for (let i = 0; i < rows.length; i++) {
          usersArray.push(rows.item(i));
        }
        setUsers(usersArray);
      });
    });
  }, []);

  const handleVerifyUser = (id) => {
    sqliteDB.transaction(tx => {
      tx.executeSql('UPDATE profiles SET isVerified = 1 WHERE id = ?', [id], () => {
        setUsers(users.map(user => user.id === id ? { ...user, isVerified: true } : user));
      });
    });
  };

  const handleBanUser = (id) => {
    sqliteDB.transaction(tx => {
      tx.executeSql('DELETE FROM profiles WHERE id = ?', [id], () => {
        setUsers(users.filter(user => user.id !== id));
      });
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Verify Users</Typography>
      <List>
        {users.map(user => (
          <ListItem key={user.id}>
            <ListItemText primary={`${user.name} (${user.dob})`} secondary={user.isVerified ? 'Verified' : 'Not Verified'} />
            {!user.isVerified && (
              <Button variant="contained" color="primary" onClick={() => handleVerifyUser(user.id)}>
                Verify
              </Button>
            )}
            <IconButton color="secondary" onClick={() => handleBanUser(user.id)}>
              <BlockIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
}

// ManageCandidates component
function ManageCandidates() {
  const [candidate, setCandidate] = useState('');
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    sqliteDB.transaction(tx => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS candidates (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)');
      tx.executeSql('SELECT * FROM candidates', [], (tx, results) => {
        const rows = results.rows;
        let candidatesArray = [];
        for (let i = 0; i < rows.length; i++) {
          candidatesArray.push(rows.item(i));
        }
        setCandidates(candidatesArray);
      });
    });
  }, []);

  const handleAddCandidate = () => {
    if (candidate) {
      sqliteDB.transaction(tx => {
        tx.executeSql('INSERT INTO candidates (name) VALUES (?)', [candidate], () => {
          setCandidates([...candidates, { id: Date.now(), name: candidate }]);
          setCandidate('');
        });
      });
    }
  };

  const handleDeleteCandidate = (id) => {
    sqliteDB.transaction(tx => {
      tx.executeSql('DELETE FROM candidates WHERE id = ?', [id], () => {
        setCandidates(candidates.filter(c => c.id !== id));
      });
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Manage Candidates</Typography>
      <TextField
        label="New Candidate"
        value={candidate}
        onChange={(e) => setCandidate(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={handleAddCandidate}>Add Candidate</Button>
      <div style={{ marginTop: '20px' }}>
        <Typography variant="h6">Candidates</Typography>
        <List>
          {candidates.map(c => (
            <ListItem key={c.id}>
              <ListItemText primary={c.name} />
              <IconButton color="secondary" onClick={() => handleDeleteCandidate(c.id)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </div>
    </div>
  );
}

// Main AdminApp component
function AdminApp() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<div style={{ padding: '20px' }}><Typography variant="h4">Admin Home</Typography></div>} />
          <Route path="/users" element={<VerifyUsers />} />
          <Route path="/candidates" element={<ManageCandidates />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

ReactDOM.render(<AdminApp />, document.getElementById('admin-root'));
