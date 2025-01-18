/**** bare bones example ****/

// Lizzy.js config
window.__lizzyconf = {
  index: '/posts/', // where are the articles on the server
  root: document.getElementById('root'), // render the app here
  read: '/read/', // for bookmarking article URLs
};

/**** full featured example ****/

// Lizzy.js config
window.__lizzyconf = {

  // 1. required, same as above

  index: '/posts/',
  root: document.getElementById('root'),
  read: '/read/',

  // 2. optionals, for giggles

  // render article content here, not in the root, reserve the root for the listing only
  content: document.getElementsByTagName('article')[0],
  // do things when the article is rendered
  contentDidMount: () => {
    // futz around with css
    document.body.classList.add('reading');
    // update document title, why not
    document.title = document.querySelector('article h1').innerText;
    // pretty print code, yes, let's overachieve!
    if (document.getElementsByClassName('prettyprint').length) {
      if (window.PR) {
        PR.prettyPrint();
      } else {
        document.body.append(
          Object.assign(document.createElement('script'), {
            src: '/run_prettify.js', // outdated Google-made code highlighter
            id: 'prettifyjs',
          }),
        );
      }
    }
  },
  // undo things when the article is removed, e.g. user hits the BACK button
  contentDidUnmount: () => {
    document.body.classList.remove('reading');
    document.title = 'Home, sweet home';
  },
};
