let tokenClient;
let gapiInited = false;
let gisInited = false;
let currentDocs = [];

const API_KEY = 'AIzaSyAbdZFGTKTByIF_FbxCC1FkG2mFIso9Z5g';
const CLIENT_ID = '470202564422-8ncvbtktlpe4n3n4duo2db7lt5sfujin.apps.googleusercontent.com';

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly';

// ---------- INIT ----------

window.initGoogle = async function () {
  if (gapiInited && gisInited) return;

  await new Promise((resolve) => gapi.load('client', resolve));

  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [
		'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
		'https://docs.googleapis.com/$discovery/rest?version=v1',
		'https://classroom.googleapis.com/$discovery/rest?version=v1'
	  ]
  });

  gapiInited = true;

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: () => {}
  });

  gisInited = true;
};

// ---------- AUTH ----------

async function ensureSignedIn() {
  await window.initGoogle();

  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) reject(resp);
      resolve();
    };
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

// ---------- DRIVE ----------

window.searchGoogleDrive = async function () {
  await ensureSignedIn();

  const response = await gapi.client.drive.files.list({
    q: "mimeType='application/vnd.google-apps.document'",
    pageSize: 50,
    fields: 'files(id,name,modifiedTime,webViewLink)',
    orderBy: 'modifiedTime desc'
  });

  currentDocs = response.result.files || [];
  return currentDocs;
};

window.downloadGoogleDoc = async function (fileId) {
  await ensureSignedIn();

  const response = await gapi.client.drive.files.export({
    fileId,
    mimeType: 'text/plain'
  });

  return response.body;
};

// ---------- DOCS BROWSER ----------

window.loadGoogleDocs = async function() {
  const loadingEl = document.getElementById('docs-loading');
  const listEl = document.getElementById('docs-list');
  const emptyEl = document.getElementById('docs-empty');
  
  loadingEl.style.display = 'block';
  listEl.innerHTML = '';
  emptyEl.style.display = 'none';
  
  try {
    const docs = await window.searchGoogleDrive();
    loadingEl.style.display = 'none';
    
    if (docs.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }
    
    docs.forEach(doc => {
      const docCard = document.createElement('div');
      docCard.className = 'doc-card glass';
      docCard.innerHTML = `
        <div class="doc-header">
          <div class="doc-icon">📝</div>
          <div class="doc-info">
            <h4 class="doc-title">${doc.name}</h4>
            <p class="doc-date">Modified ${new Date(doc.modifiedTime).toLocaleDateString()}</p>
          </div>
        </div>
        <div class="doc-actions">
          <button class="btn-secondary" onclick="openGoogleDoc('${doc.webViewLink}')">Open</button>
          <button class="btn-primary" onclick="importGoogleDoc('${doc.id}', '${doc.name}')">Import</button>
        </div>
      `;
      listEl.appendChild(docCard);
    });
  } catch (error) {
    loadingEl.style.display = 'none';
    showNotification('Error loading Google Docs. Please try again.', 'error');
    showNotification('Failed to load Google Docs. Please try again.', 'error');
  }
};

window.openGoogleDoc = function(url) {
  window.open(url, '_blank');
};

window.importGoogleDoc = async function(docId, docName) {
  try {
    const content = await window.downloadGoogleDoc(docId);
    
    const noteData = {
      userId: localStorage.getItem('userId'),
      title: docName,
      content: content,
      classId: null
    };
    
    const response = await fetch('http://localhost:5000/api/notes/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(noteData)
    });
    
    if (response.ok) {
      showNotification('Google Doc imported successfully!', 'success');
      loadData(); // Reload notes
    } else {
      showNotification('Failed to import Google Doc', 'error');
    }
  } catch (error) {
    showNotification('Failed to import Google Doc', 'error');
    showNotification('Failed to import Google Doc', 'error');
  }
};

window.searchDocs = function(query) {
  const listEl = document.getElementById('docs-list');
  const emptyEl = document.getElementById('docs-empty');
  
  if (!query) {
    window.loadGoogleDocs();
    return;
  }
  
  const filteredDocs = currentDocs.filter(doc => 
    doc.name.toLowerCase().includes(query.toLowerCase())
  );
  
  listEl.innerHTML = '';
  
  if (filteredDocs.length === 0) {
    emptyEl.style.display = 'block';
    return;
  }
  
  emptyEl.style.display = 'none';
  
  filteredDocs.forEach(doc => {
    const docCard = document.createElement('div');
    docCard.className = 'doc-card glass';
    docCard.innerHTML = `
      <div class="doc-header">
        <div class="doc-icon">📝</div>
        <div class="doc-info">
          <h4 class="doc-title">${doc.name}</h4>
          <p class="doc-date">Modified ${new Date(doc.modifiedTime).toLocaleDateString()}</p>
        </div>
      </div>
      <div class="doc-actions">
        <button class="btn-secondary" onclick="openGoogleDoc('${doc.webViewLink}')">Open</button>
        <button class="btn-primary" onclick="importGoogleDoc('${doc.id}', '${doc.name}')">Import</button>
      </div>
    `;
    listEl.appendChild(docCard);
  });
};

window.createNewGoogleDoc = async function() {
  // Create in-app prompt modal
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content glass">
      <div class="modal-header">
        <h3>Create Google Doc</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-form">
        <input type="text" id="doc-title-input" placeholder="Enter document title" required>
        <div class="modal-actions">
          <button type="button" class="btn-secondary modal-cancel">Cancel</button>
          <button type="button" class="btn-primary" id="create-doc-confirm">Create</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeModal = () => document.body.removeChild(modal);
  
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  modal.querySelector('#create-doc-confirm').addEventListener('click', async () => {
    const title = document.getElementById('doc-title-input').value.trim();
    if (!title) {
      showNotification('Please enter a document title', 'error');
      return;
    }
    
    try {
      const docId = await window.createGoogleDoc(title);
      const docUrl = `https://docs.google.com/document/d/${docId}/edit`;
      window.open(docUrl, '_blank');
      showNotification('Google Doc created successfully!', 'success');
      setTimeout(() => window.loadGoogleDocs(), 1000);
      closeModal();
    } catch (error) {
      showNotification('Error creating Google Doc', 'error');
    }
  });
};


// ---------- DOCS ----------

window.createGoogleDoc = async function (title, content = '') {
  await ensureSignedIn();

  const doc = await gapi.client.docs.documents.create({
    resource: { title }
  });

  if (content) {
    await gapi.client.docs.documents.batchUpdate({
      documentId: doc.result.documentId,
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: content
          }
        }
      ]
    });
  }

  return doc.result.documentId;
};

// ---------- CLASSROOM ----------

window.fetchGoogleClasses = async function () {
  await ensureSignedIn();

  const res = await gapi.client.classroom.courses.list({
    courseStates: ['ACTIVE']
  });

  return res.result.courses || [];
};

window.fetchClassroomAssignments = async function (courseId) {
  await ensureSignedIn();

  const res = await gapi.client.classroom.courses.courseWork.list({
    courseId,
    courseWorkStates: ['PUBLISHED']
  });

  return res.result.courseWork || [];
};
