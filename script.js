class NoteMasterPro {
    constructor() {
        this.notes = [];
        this.currentNoteId = null;
        this.currentFilter = 'all';
        this.currentSort = 'updated';
        this.autoSaveInterval = 1000;
        this.settings = {
            autoSaveInterval: 1000,
            fontSize: '16px',
            wordWrap: true,
            showWordCount: true
        };
        this.init();
    }

    init() {
        this.loadSettings();
        this.loadNotes();
        this.bindEvents();
        this.updateStats();
        this.updateCategoryFilters();
        this.renderNotes();
        this.initTheme();
        this.applySettings();
    }

    bindEvents() {
        // Basic functionality
        document.getElementById('addNoteBtn').addEventListener('click', () => this.createNote());
        document.getElementById('floatAddBtn').addEventListener('click', () => this.createNote());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveCurrentNote());
        document.getElementById('duplicateBtn').addEventListener('click', () => this.duplicateNote());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteNote());
        
        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => this.searchNotes(e.target.value));
        
        // Theme and settings
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.hideSettings());
        
        // Import/Export
        document.getElementById('exportBtn').addEventListener('click', () => this.exportAllNotes());
        document.getElementById('importBtn').addEventListener('click', () => this.showImport());
        document.getElementById('closeImport').addEventListener('click', () => this.hideImport());
        document.getElementById('uploadBtn').addEventListener('click', () => this.importNotes());
        document.getElementById('backupBtn').addEventListener('click', () => this.createBackup());
        
        // Export options
        document.getElementById('exportTxtBtn').addEventListener('click', () => this.exportCurrentNote('txt'));
        document.getElementById('exportMarkdownBtn').addEventListener('click', () => this.exportCurrentNote('md'));
        document.getElementById('printBtn').addEventListener('click', () => this.printNote());
        
        // Auto-save
        document.getElementById('noteEditor').addEventListener('input', () => this.handleAutoSave());
        document.getElementById('noteTitleInput').addEventListener('input', () => this.handleAutoSave());
        document.getElementById('tagsInput').addEventListener('input', () => this.handleAutoSave());
        document.getElementById('prioritySelect').addEventListener('change', () => this.handleAutoSave());
        
        // Word count
        document.getElementById('noteEditor').addEventListener('input', () => this.updateWordCount());
        
        // Sort buttons
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentSort = e.target.dataset.sort;
                this.renderNotes();
            });
        });
        
        // Formatting buttons
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.applyFormatting(e.target.dataset.format));
        });
        
        // Settings
        document.getElementById('autoSaveInterval').addEventListener('change', (e) => {
            this.settings.autoSaveInterval = parseInt(e.target.value);
            this.saveSettings();
        });
        
        document.getElementById('fontSize').addEventListener('change', (e) => {
            this.settings.fontSize = e.target.value;
            this.saveSettings();
            this.applySettings();
        });
        
        document.getElementById('wordWrap').addEventListener('change', (e) => {
            this.settings.wordWrap = e.target.checked;
            this.saveSettings();
            this.applySettings();
        });
        
        document.getElementById('showWordCount').addEventListener('change', (e) => {
            this.settings.showWordCount = e.target.checked;
            this.saveSettings();
            this.applySettings();
        });

        // Modal backdrop clicks
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) this.hideSettings();
        });
        
        document.getElementById('importModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) this.hideImport();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleKeyboardShortcuts(e) {
        // Ctrl+N or Cmd+N - New note
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.createNote();
        }
        
        // Ctrl+S or Cmd+S - Save note
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveCurrentNote();
        }
        
        // Ctrl+D or Cmd+D - Duplicate note
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.duplicateNote();
        }
        
        // Ctrl+/ or Cmd+/ - Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    }

    createNote() {
        const note = {
            id: Date.now(),
            title: 'Untitled Note',
            content: '',
            tags: [],
            priority: 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(note);
        this.saveNotes();
        this.loadNote(note.id);
        this.updateStats();
        this.updateCategoryFilters();
        this.renderNotes();
        
        // Focus title and select text
        setTimeout(() => {
            const titleInput = document.getElementById('noteTitleInput');
            titleInput.focus();
            titleInput.select();
        }, 100);
        
        this.showToast('New note created! 📝', 'success');
    }

    loadNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        this.currentNoteId = noteId;
        document.getElementById('noteTitleInput').value = note.title;
        document.getElementById('noteEditor').value = note.content;
        document.getElementById('tagsInput').value = note.tags.join(', ');
        document.getElementById('prioritySelect').value = note.priority || 'medium';
        
        this.updateWordCount();
        this.highlightActiveNote(noteId);
    }

    saveCurrentNote() {
        if (!this.currentNoteId) return;

        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note) return;

        const title = document.getElementById('noteTitleInput').value.trim() || 'Untitled Note';
        const content = document.getElementById('noteEditor').value;
        const tagsInput = document.getElementById('tagsInput').value;
        const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
        const priority = document.getElementById('prioritySelect').value;

        note.title = title;
        note.content = content;
        note.tags = tags;
        note.priority = priority;
        note.updatedAt = new Date().toISOString();

        this.saveNotes();
        this.updateStats();
        this.updateCategoryFilters();
        this.renderNotes();
        this.showSaveStatus();
    }

    duplicateNote() {
        if (!this.currentNoteId) return;

        const originalNote = this.notes.find(n => n.id === this.currentNoteId);
        if (!originalNote) return;

        const duplicatedNote = {
            ...originalNote,
            id: Date.now(),
            title: `${originalNote.title} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(duplicatedNote);
        this.saveNotes();
        this.loadNote(duplicatedNote.id);
        this.updateStats();
        this.updateCategoryFilters();
        this.renderNotes();
        
        this.showToast('Note duplicated! 📋', 'success');
    }

    deleteNote() {
        if (!this.currentNoteId) return;

        if (confirm('🗑️ Are you sure you want to delete this note? This action cannot be undone.')) {
            this.notes = this.notes.filter(n => n.id !== this.currentNoteId);
            this.saveNotes();
            this.clearEditor();
            this.currentNoteId = null;
            this.updateStats();
            this.updateCategoryFilters();
            this.renderNotes();
            this.showToast('Note deleted 🗑️', 'success');
        }
    }

    handleAutoSave() {
        if (!this.currentNoteId) return;
        
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentNote();
        }, this.settings.autoSaveInterval);
    }

    searchNotes(query) {
        const filteredNotes = this.getFilteredNotes().filter(note => {
            const searchText = query.toLowerCase();
            return note.title.toLowerCase().includes(searchText) ||
                   note.content.toLowerCase().includes(searchText) ||
                   note.tags.some(tag => tag.toLowerCase().includes(searchText));
        });

        this.renderFilteredNotes(filteredNotes);
    }

    getFilteredNotes() {
        return this.notes.filter(note => {
            if (this.currentFilter === 'all') return true;
            return note.tags.includes(this.currentFilter);
        });
    }

    renderNotes() {
        const query = document.getElementById('searchInput').value;
        if (query) {
            this.searchNotes(query);
        } else {
            this.renderFilteredNotes(this.getFilteredNotes());
        }
    }

    renderFilteredNotes(notes) {
        // Sort notes
        const sortedNotes = [...notes].sort((a, b) => {
            switch (this.currentSort) {
                case 'created':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'updated':
                default:
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
            }
        });

        const container = document.getElementById('notesContainer');
        
        if (sortedNotes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-text">No notes found</div>
                    <div class="empty-subtext">Try adjusting your search or filters</div>
                </div>
            `;
            return;
        }

        container.innerHTML = sortedNotes.map(note => `
            <div class="note-item ${note.id === this.currentNoteId ? 'active' : ''}" 
                 data-note-id="${note.id}"
                 onclick="noteMasterPro.loadNote(${note.id})">
                <div class="note-header">
                    <div class="note-title">${this.escapeHtml(note.title)}</div>
                    <div class="note-meta">
                        <span>${this.getPriorityIcon(note.priority)}</span>
                        <span>${this.formatDate(note.updatedAt)}</span>
                    </div>
                </div>
                <div class="note-preview">${this.escapeHtml(note.content.substring(0, 150))}${note.content.length > 150 ? '...' : ''}</div>
                ${note.tags.length > 0 ? `
                    <div class="note-tags">
                        ${note.tags.map(tag => `<span class="note-tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    updateCategoryFilters() {
        const container = document.getElementById('categoryFilters');
        const allTags = [...new Set(this.notes.flatMap(note => note.tags))];
        
        const filtersHTML = allTags.map(tag => 
            `<div class="chip ${this.currentFilter === tag ? 'active' : ''}" 
                  data-category="${tag}"
                  onclick="noteMasterPro.filterByCategory('${tag}')">${this.escapeHtml(tag)}</div>`
        ).join('');

        container.innerHTML = `
            <div class="chip ${this.currentFilter === 'all' ? 'active' : ''}" 
                 data-category="all"
                 onclick="noteMasterPro.filterByCategory('all')">All Notes</div>
            ${filtersHTML}
        `;
    }

    filterByCategory(category) {
        this.currentFilter = category;
        document.querySelectorAll('.chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.category === category);
        });
        this.renderNotes();
    }

    updateStats() {
        const today = new Date().toDateString();
        const todaysNotes = this.notes.filter(note => 
            new Date(note.createdAt).toDateString() === today
        ).length;
        
        const totalWords = this.notes.reduce((sum, note) => {
            return sum + this.countWords(note.content);
        }, 0);
        
        const allTags = [...new Set(this.notes.flatMap(note => note.tags))];

        document.getElementById('totalNotes').textContent = this.notes.length;
        document.getElementById('totalWords').textContent = totalWords.toLocaleString();
        document.getElementById('totalCategories').textContent = allTags.length;
        document.getElementById('todaysNotes').textContent = todaysNotes;
    }

    updateWordCount() {
        const content = document.getElementById('noteEditor').value;
        const words = this.countWords(content);
        const characters = content.length;
        
        document.getElementById('wordCount').textContent = 
            `${words.toLocaleString()} words, ${characters.toLocaleString()} characters`;
    }

    countWords(text) {
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    }

    highlightActiveNote(noteId) {
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.noteId) === noteId);
        });
    }

    clearEditor() {
        document.getElementById('noteTitleInput').value = '';
        document.getElementById('noteEditor').value = '';
        document.getElementById('tagsInput').value = '';
        document.getElementById('prioritySelect').value = 'medium';
        this.updateWordCount();
    }

    applyFormatting(format) {
        const editor = document.getElementById('noteEditor');
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selectedText = editor.value.substring(start, end);
        
        let formattedText = '';
        
        switch (format) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
            case 'underline':
                formattedText = `<u>${selectedText}</u>`;
                break;
            case 'code':
                formattedText = `\`${selectedText}\``;
                break;
            case 'list':
                formattedText = `\n- ${selectedText}`;
                break;
            case 'quote':
                formattedText = `> ${selectedText}`;
                break;
        }
        
        editor.value = editor.value.substring(0, start) + formattedText + editor.value.substring(end);
        editor.focus();
        editor.setSelectionRange(start + formattedText.length, start + formattedText.length);
        
        this.handleAutoSave();
        this.updateWordCount();
    }

    exportCurrentNote(format) {
        if (!this.currentNoteId) {
            this.showToast('No note selected 📄', 'error');
            return;
        }

        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note) return;

        let content = '';
        let filename = '';
        let mimeType = '';

        switch (format) {
            case 'txt':
                content = `${note.title}\n\n${note.content}`;
                filename = `${this.sanitizeFilename(note.title)}.txt`;
                mimeType = 'text/plain';
                break;
            case 'md':
                content = `# ${note.title}\n\n${note.content}\n\n---\nTags: ${note.tags.join(', ')}\nPriority: ${note.priority}\nCreated: ${new Date(note.createdAt).toLocaleDateString()}`;
                filename = `${this.sanitizeFilename(note.title)}.md`;
                mimeType = 'text/markdown';
                break;
        }

        this.downloadFile(content, filename, mimeType);
        this.showToast(`Note exported as ${format.toUpperCase()}! 📤`, 'success');
    }

    exportAllNotes() {
        const exportData = {
            notes: this.notes,
            exportDate: new Date().toISOString(),
            version: '2.0',
            totalNotes: this.notes.length
        };

        const content = JSON.stringify(exportData, null, 2);
        this.downloadFile(content, 'notemaster-backup.json', 'application/json');
        this.showToast('All notes exported! 📦', 'success');
    }

    printNote() {
        if (!this.currentNoteId) {
            this.showToast('No note selected 🖨️', 'error');
            return;
        }

        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${note.title}</title>
                    <style>
                        body { 
                            font-family: 'Inter', Arial, sans-serif; 
                            max-width: 800px; 
                            margin: 0 auto; 
                            padding: 40px; 
                            line-height: 1.6;
                            color: #333;
                        }
                        h1 { 
                            color: #2d3436; 
                            border-bottom: 3px solid #667eea; 
                            padding-bottom: 15px; 
                            margin-bottom: 20px;
                        }
                        .meta { 
                            color: #636e72; 
                            font-size: 0.9em; 
                            margin-bottom: 30px; 
                            background: #f8f9fa;
                            padding: 15px;
                            border-radius: 8px;
                            border-left: 4px solid #667eea;
                        }
                        .content { 
                            line-height: 1.8; 
                            font-size: 16px;
                            white-space: pre-wrap;
                        }
                        .tags {
                            margin-top: 20px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                        }
                        .tag {
                            display: inline-block;
                            background: #667eea;
                            color: white;
                            padding: 4px 12px;
                            border-radius: 15px;
                            font-size: 0.8em;
                            margin-right: 8px;
                        }
                    </style>
                </head>
                <body>
                    <h1>${this.escapeHtml(note.title)}</h1>
                    <div class="meta">
                        <strong>Priority:</strong> ${this.getPriorityIcon(note.priority)} ${note.priority.toUpperCase()} <br>
                        <strong>Created:</strong> ${new Date(note.createdAt).toLocaleDateString()} <br>
                        <strong>Last Updated:</strong> ${new Date(note.updatedAt).toLocaleDateString()}
                        ${note.tags.length > 0 ? `<br><strong>Tags:</strong> <div class="tags">${note.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                    </div>
                    <div class="content">${this.escapeHtml(note.content)}</div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        this.showToast('Note sent to printer! 🖨️', 'success');
    }

    createBackup() {
        this.exportAllNotes();
        this.showToast('Backup created and downloaded! ☁️', 'success');
    }

    showImport() {
        document.getElementById('importModal').classList.add('show');
    }

    hideImport() {
        document.getElementById('importModal').classList.remove('show');
    }

    importNotes() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showToast('Please select a file 📁', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.notes && Array.isArray(data.notes)) {
                    const importCount = data.notes.length;
                    this.notes = [...data.notes, ...this.notes];
                    this.saveNotes();
                    this.updateStats();
                    this.updateCategoryFilters();
                    this.renderNotes();
                    this.hideImport();
                    this.showToast(`Imported ${importCount} notes! 📥`, 'success');
                } else {
                    this.showToast('Invalid file format ❌', 'error');
                }
            } catch (error) {
                this.showToast('Error reading file ❌', 'error');
            }
        };
        reader.readAsText(file);
    }

    showSettings() {
        document.getElementById('settingsModal').classList.add('show');
        
        // Load current settings
        document.getElementById('autoSaveInterval').value = this.settings.autoSaveInterval;
        document.getElementById('fontSize').value = this.settings.fontSize;
        document.getElementById('wordWrap').checked = this.settings.wordWrap;
        document.getElementById('showWordCount').checked = this.settings.showWordCount;
    }

    hideSettings() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    applySettings() {
        const editor = document.getElementById('noteEditor');
        editor.style.fontSize = this.settings.fontSize;
        editor.style.whiteSpace = this.settings.wordWrap ? 'pre-wrap' : 'pre';
        
        const wordCount = document.getElementById('wordCount');
        wordCount.style.display = this.settings.showWordCount ? 'block' : 'none';
    }

    saveSettings() {
        try {
            localStorage.setItem('notemaster-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.log('Settings saved to memory only');
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('notemaster-settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.log('Using default settings');
        }
    }

    showSaveStatus() {
        const status = document.getElementById('saveStatus');
        status.classList.add('show');
        setTimeout(() => status.classList.remove('show'), 2000);
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✅' : '❌'}</span>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }

    getPriorityIcon(priority) {
        const icons = {
            low: '🟢',
            medium: '🟡',
            high: '🔴'
        };
        return icons[priority] || '🟡';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1}d ago`;
        if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}w ago`;
        
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    initTheme() {
        try {
            const savedTheme = localStorage.getItem('notemaster-theme') || 'dark';
            document.body.setAttribute('data-theme', savedTheme);
            this.updateThemeToggle();
        } catch (error) {
            document.body.setAttribute('data-theme', 'dark');
            this.updateThemeToggle();
        }
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        
        try {
            localStorage.setItem('notemaster-theme', newTheme);
        } catch (error) {
            console.log('Theme preference saved to session only');
        }
        
        this.updateThemeToggle();
        
        // Add pulse animation to theme button
        const themeBtn = document.getElementById('themeToggle');
        themeBtn.classList.add('pulse');
        setTimeout(() => themeBtn.classList.remove('pulse'), 500);
        
        this.showToast(`Switched to ${newTheme} theme! 🎨`, 'success');
    }

    updateThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const currentTheme = document.body.getAttribute('data-theme');
        themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }

    saveNotes() {
        // In a real application, this would save to a database or server
        try {
            localStorage.setItem('notemaster-notes', JSON.stringify(this.notes));
        } catch (error) {
            console.log('Notes saved to memory only');
        }
    }

    loadNotes() {
        try {
            const saved = localStorage.getItem('notemaster-notes');
            if (saved) {
                this.notes = JSON.parse(saved);
                return;
            }
        } catch (error) {
            console.log('Loading sample data');
        }

        // Load sample data if no saved notes
        if (this.notes.length === 0) {
            this.notes = [
                {
                    id: 1,
                    title: '🎉 Welcome to NoteMaster Pro!',
                    content: `# Welcome to the most advanced note-taking experience!

## ✨ New Features & Improvements:
- **🎨 Beautiful Animated Background** with floating shapes
- **📝 Rich Text Formatting** with markdown-like syntax
- **🏷️ Priority Levels** to organize your tasks (🟢 Low, 🟡 Medium, 🔴 High)
- **🔍 Advanced Search** through titles, content, and tags
- **📤 Export Options** - TXT, Markdown, and Print
- **🌙 Theme Toggle** between stunning dark and light modes
- **⚡ Auto-save** with customizable intervals
- **📥 Import/Export** your notes as JSON
- **📊 Word Count** and character tracking
- **📱 Responsive Design** that works perfectly on all devices
- **⌨️ Keyboard Shortcuts** for power users

## 🚀 Pro Tips:
1. **Tags**: Use tags to organize notes by project or topic
2. **Priorities**: Set priorities to focus on important notes first
3. **Formatting**: Use formatting buttons to style your text beautifully
4. **Auto-save**: Your work is automatically saved as you type
5. **Export**: Export individual notes or your entire collection
6. **Shortcuts**: Press Ctrl+N for new note, Ctrl+S to save, Ctrl+/ to search

## ⌨️ Keyboard Shortcuts:
- **Ctrl/Cmd + N**: Create new note
- **Ctrl/Cmd + S**: Save current note
- **Ctrl/Cmd + D**: Duplicate note
- **Ctrl/Cmd + /**: Focus search box

## 🎨 Stunning Design Features:
- **Animated Background**: Beautiful floating shapes that respond to your theme
- **Glass Morphism**: Modern frosted glass effects throughout the interface
- **Smooth Animations**: Every interaction feels fluid and responsive
- **Gradient Colors**: Vibrant color schemes that adapt to your theme

Start creating amazing notes and boost your productivity to the next level! 🚀`,
                    tags: ['welcome', 'tutorial', 'productivity', 'features'],
                    priority: 'high',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 2,
                    title: '📋 Meeting Notes Template',
                    content: `# Meeting: [Meeting Title]
**Date:** ${new Date().toLocaleDateString()}
**Attendees:** [Names]
**Duration:** [Time]
**Location/Platform:** [Physical location or video platform]

## 📋 Agenda:
- [ ] Welcome & introductions
- [ ] Review previous action items
- [ ] Main discussion topics
- [ ] Decision making
- [ ] Next steps & action items

## 💡 Discussion Points:
> Key decisions, important discussions, and insights...

### Topic 1: [Topic Name]
- Discussion summary...
- Key points raised...

### Topic 2: [Topic Name]  
- Discussion summary...
- Key points raised...

## ✅ Action Items:
- [ ] **Task 1** - Assigned to: [Name] - Due: [Date]
- [ ] **Task 2** - Assigned to: [Name] - Due: [Date]
- [ ] **Task 3** - Assigned to: [Name] - Due: [Date]

## 📅 Next Meeting:
**Date:** [Next meeting date]
**Topics:** [What to discuss next time]
**Preparation needed:** [Any prep work required]

## 📝 Additional Notes:
[Any other important information or follow-ups]`,
                    tags: ['template', 'meetings', 'work', 'productivity'],
                    priority: 'medium',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    updatedAt: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 3,
                    title: '💡 Project Ideas & Brainstorming',
                    content: `# Creative Project Ideas 🎨



*"The best ideas come when you're not trying to have them"* ✨`,
                    tags: ['ideas', 'brainstorming', 'development', 'future'],
                    priority: 'low',
                    createdAt: new Date(Date.now() - 172800000).toISOString(),
                    updatedAt: new Date(Date.now() - 172800000).toISOString()
                }
            ];
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.noteMasterPro = new NoteMasterPro();
});

// Global function for note item clicks (needed for onclick handlers)
window.noteMasterPro = null;