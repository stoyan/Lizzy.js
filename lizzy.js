// Lizzy.js source
(async function () {
  const conf = window.__lizzyconf;

  // read content goes here, if no conf.content given
  conf.root.innerHTML = '<div>Loading...</div>';

  buildIndex = async function buildIndex() {
    const respo = await fetch(conf.index);
    const text = await respo.text();
    conf.root.innerHTML = '<div></div>';

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const pages = Array.from(doc.getElementsByTagName('a')).filter(
      (a) =>
        a.textContent !== 'Parent Directory' &&
        !a.getAttribute('href').startsWith('?') &&
        !a.textContent.startsWith('_'),
    );
    const ul = document.createElement('ul');
    pages.forEach((p) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = conf.read + p.getAttribute('href').replace('.md', '');
      a.textContent = kebabToTitleCase(
        p.getAttribute('href').replace('.md', ''),
      );
      li.append(a);
      ul.append(li);
    });
    conf.root.append(ul);
  };

  buildIndex();

  conf.root.addEventListener('click', (event) => {
    const target = event.target;
    if (target.tagName === 'A' && target.href) {
      event.preventDefault();
      const url = target.pathname.replace(conf.read, conf.index) + '.md';
      renderPost(url);
      if (location.href !== target.href) {
        history.pushState({page: url}, '', target.href);
        (conf.content || conf.root.firstChild).scrollIntoView();
      }
    }
  });

  if (location.pathname.startsWith(conf.read)) {
    renderPost(location.pathname.replace(conf.read, conf.index) + '.md');
  }

  onpopstate = ({state}) => {
    if (!state) {
      (conf.content || conf.root.firstChild).innerHTML = '';
      conf.contentDidUnmount();
    } else {
      renderPost(state.page);
    }
  };

  function renderPost(url) {
    fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return [await response.text(), response.headers.get('Last-Modified')];
      })
      .then(([content, date]) => {
        const where = conf.content || conf.root.firstChild;
        dateContent = '';
        if (date) {
          const maybedate = new Date(date).toDateString();
          if (maybedate !== 'InvalidDate') {
            dateContent = `<div class="lizzy-last-modified">${maybedate}</div>\n`;
          }
        }
        where.innerHTML = dateContent + md2html(content);
        conf.contentDidMount();
      })
      .catch((error) => {
        console.error('Error fetching the file:', error);
      });
  }

  function kebabToTitleCase(str) {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // ucfirst
      .join(' ');
  }

  // "borrowed" and expanded https://github.com/g105b/markdown-to-html/blob/master/src/markdown-to-html.js
  const md2html = (() => {
    const BLOCK = 'block';
    const INLINE = 'inline';
    // prettier-ignore
    const parseMap = [
        {pattern: /([^!])\[([^\[]+)\]\(([^\)]+)\)/g, replace: "$1<a href=\"$3\">$2</a>", type: INLINE},
        {pattern: /!\[([^\[]+)\]\(([^\)]+)\)/g, replace: "<img src=\"$2\" alt=\"$1\" />", type: INLINE},
        {pattern: /(#{1,6})([^\n]+)/g, replace: "<h$L1>$2</h$L1>", type: BLOCK},
        {pattern: /\n(?!<\/?\w+>|\s?\*|\s?[0-9]+|>|\&gt;|-{5,})([^\n]+)/g, replace: "<p>$1</p>", type: BLOCK},
        {pattern: /\n(?:&gt;|\>)\W*(.*)/g, replace: "<blockquote><p>$1</p></blockquote>", type: BLOCK},
        {pattern: /\n\s?\*\s*(.*)/g, replace: "<ul>\n\t<li>$1</li>\n</ul>", type: BLOCK},
        {pattern: /\n\s?[0-9]+\.\s*(.*)/g, replace: "<ol>\n\t<li>$1</li>\n</ol>", type: BLOCK},
        {pattern: /(\*\*|__)(.*?)\1/g, replace: "<strong>$2</strong>", type: INLINE},
        {pattern: /(\*|_)(.*?)\1/g, replace: "<em>$2</em>", type: INLINE},
        {pattern: /\~\~(.*?)\~\~/g, replace: "<del>$1</del>", type: INLINE},
        {pattern: /`(.*?)`/g, replace: "<code>$1</code>", type: INLINE},
        {pattern: /\n-{5,}\n/g, replace: "<hr />", type: BLOCK},
      ];

    const clean = (string) => {
      const cleaningRuleArray = [
        {match: /<\/([uo]l)>\s*<\1>/g, replacement: ''},
        {match: /(<\/\w+>)<\/(blockquote)>\s*<\2>/g, replacement: '$1'},
      ];

      cleaningRuleArray.forEach((rule) => {
        string = string.replace(rule.match, rule.replacement);
      });

      return string;
    };

    const replace = (matchList, replacement, type) => {
      Object.keys(matchList).forEach((i) => {
        if (matchList.hasOwnProperty(i)) {
          replacement = replacement.split(`$${i}`).join(matchList[i]);
          replacement = replacement.split(`$L${i}`).join(matchList[i].length);
        }
      });

      if (type === BLOCK) {
        replacement = replacement.trim() + '\n';
      }

      return replacement;
    };

    return function parse(string) {
      output = '\n' + string + '\n';

      // Preserve all HTML
      const preservedBlocks = [];
      output = output.replace(
        /<([a-z][\w-]*)([^>]*)>([\s\S]*?)<\/\1>/gi,
        (match) => {
          const placeholder = `@@PRESERVEDBLOCK${preservedBlocks.length}@@`;
          preservedBlocks.push(match);
          return placeholder;
        },
      );

      parseMap.forEach((p) => {
        output = output.replace(p.pattern, function () {
          return replace.call(this, arguments, p.replace, p.type);
        });
      });

      // Restore HTML
      preservedBlocks.forEach((block, index) => {
        const placeholder = `@@PRESERVEDBLOCK${index}@@`;
        output = output.replace(placeholder, block);
      });

      output = clean(output);
      output = output.trim().replace(/[\n]{1,}/g, '\n');
      return output;
    };
  })();
})();
