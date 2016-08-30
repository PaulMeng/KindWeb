CodeMirror.defineMode('ocaml', function() {

  var words = {
    'true': 'atom',
    'false': 'atom',
    'or':'atom',
    'let': 'keyword',
    "var":"keyword",
    "tel":"keyword",
    "returns":"keyword",
    "node":"keyword",
    "pre":"pre",
    'if': 'conditional',
    'then': 'conditional',
    'else': 'conditional',
    'bool':"type",
    'int':"type"
    
    
    
  };

  function tokenBase(stream, state) {
    var ch = stream.next();

    if (ch === '"') {
      state.tokenize = tokenString;
      return state.tokenize(stream, state);
    }
    if (ch === '-') {
      if (stream.eat('-')) {
        state.commentLevel++;
        state.tokenize = tokenComment;
        return state.tokenize(stream, state);
      }
    }
    if (ch === '~') {
      stream.eatWhile(/\w/);
      return 'variable-2';
    }
    if (ch === '`') {
      stream.eatWhile(/\w/);
      return 'quote';
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\d]/);
      if (stream.eat('.')) {
        stream.eatWhile(/[\d]/);
      }
      return 'number';
    }
    if ( /[+\-*&%=<>!?|]/.test(ch)) {
      return 'operator';
    }
    stream.eatWhile(/\w/);
    var cur = stream.current();
    return words[cur] || 'variable';
  }

  function tokenString(stream, state) {
    var next, end = false, escaped = false;
    while ((next = stream.next()) != null) {
      if (next === '"' && !escaped) {
        end = true;
        break;
      }
      escaped = !escaped && next === '\\';
    }
    if (end && !escaped) {
      state.tokenize = tokenBase;
    }
    return 'string';
  };

  function tokenComment(stream, state) {
	  
    var prev, next;
    while(state.commentLevel > 0 && (next = stream.next()) != null) {
      if (prev === '-' && next === '-') state.commentLevel=1;
      if (prev === '\\' && next==='n') state.commentLevel=0;
      prev = next;
    }
      state.tokenize = tokenBase;
    
    return 'comment';
  }

  return {
    startState: function() {return {tokenize: tokenBase, commentLevel: 0};},
    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      return state.tokenize(stream, state);
    },

    lineComment: "--"
  };
});

CodeMirror.defineMIME('text/x-ocaml', 'ocaml');
