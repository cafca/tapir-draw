import React, { useEffect, useState } from 'react';
import { TldrawApp, TDShape, TDBinding, Tldraw } from '@tldraw/tldraw';
import debug from 'debug';
import { ApolloProvider, useQuery, gql } from '@apollo/client';

import { usePeerToPanda } from './p2panda-react';

import type { Session } from 'p2panda-js';

import '~/styles.css';

const log = debug('tapir-draw');

// const session = new Session(ENDPOINT);
let syncInterval: number;

// type Document = {
//   _meta: {
//     author: string;
//     deleted: boolean;
//     edited: boolean;
//     entries: string[];
//     id: string;
//     last_operation: string;
//     schema: string;
//   };
// };

// type Element = Document & {
//   title: string;
//   url: string;
//   created: string;
// };

interface BookmarkData {
  bookmarks: [
    {
      document: string;
      previousOperations: string;
      fields: Element;
    },
  ];
}

type Element = {
  title: string;
  url: string;
  created: string;
};

const TLDRAW_SCHEMA =
  '0020c65567ae37efea293e34a9c7d13f8f2bf23dbdc3b5c7b9ab46293111c48fc78b';

const GET_BOOKMARKS = gql`
  {
    bookmarks {
      document
      previousOperations
      fields {
        created
        url
        title
      }
    }
  }
`;

const App = (): JSX.Element => {
  const [app, setApp] = useState<TldrawApp>();
  const session: Session = usePeerToPanda();
  const [elements, setElements] = useState(null);

  const { data } = useQuery<BookmarkData>(GET_BOOKMARKS, {
    pollInterval: 5000,
  });

  const onMount = (app: TldrawApp) => {
    app.loadRoom('test-9');
    app.pause();
    setApp(app);
  };

  // Publish TLDraw state on change

  const handleTLDrawChange = (
    app: TldrawApp,
    shapes: Record<string, TDShape | undefined>,
    bindings: Record<string, TDBinding | undefined>,
  ) => {
    session.setSchema(TLDRAW_SCHEMA);
    const asyncHandler = async () => {
      //  New handlers? Do't really need them but why not. They have error handling!
      const update = async (id, prev_ops, document) => {
        try {
          await session.update(id, prev_ops, document);
        } catch (err) {
          log('Error updating', { id, document, err });
        }
      };

      const create = async (document) => {
        try {
          await session.create(document);
        } catch (err) {
          log('Error creating', { document });
        }
      };

      const deleteDocument = async (document, prev_ops) => {
        try {
          await session.delete(document, prev_ops);
        } catch (err) {
          log('Error deleting', { document });
        }
      };

      // Iterate over TLDraw's little world and sending all updates to p2panda.
      // This happens whenever there is a change in the document.
      Object.entries(shapes).forEach(async ([id, shape]) => {
        // Superhacky: title, url, created don't really make sense. This is
        // using a database hardcoded into aqudoggo which is supposed to be
        // for bookmarks ... well - it works!
        const shapeFields = {
          title: JSON.stringify(shape),
          url: 'shape',
          created: id,
        };

        // Look up whether we have retrieved this element from the server before
        // then we can only do updates on it and not create
        const publishedElem = data.bookmarks.find(
          ({ fields: { created } }) => created === id,
        );
        if (publishedElem) {
          const previousOperations =
            publishedElem.previousOperations?.split(',');
          // The `title` field contains the serialised element. If there's
          // nothing there it means that has been deleted.
          if (shapeFields.title == null) {
            await deleteDocument(publishedElem.document, previousOperations);
          } else {
            await update(
              publishedElem.document,
              shapeFields,
              previousOperations,
            );
          }
        } else {
          await create(shapeFields);
        }
      });

      Object.entries(bindings).forEach(async ([id, binding]) => {
        const bindingsFields = {
          title: JSON.stringify(binding),
          url: 'binding',
          created: binding.id,
        };

        const publishedElem = elements.find(({ created }) => created === id);
        if (publishedElem) {
          const previousOperations =
            publishedElem.previousOperations?.split(',');

          if (bindingsFields.title == null) {
            await deleteDocument(publishedElem.document, previousOperations);
          } else {
            await update(
              publishedElem.document,
              bindingsFields,
              previousOperations,
            );
          }
        } else {
          await create(bindingsFields);
        }
      });
    };
    asyncHandler();
  };

  // Load from p2panda

  useEffect(() => {
    if (!data) return;

    const syncEntries = async () => {
      // This parser transfers the data format from p2panda into what's expected
      // by TLDraw
      const parser = ({ fields: elem }: { fields: Element }) => {
        const id = elem.created;
        const shape = JSON.parse(elem.title);
        return [id, shape];
      };

      const shapes = data.bookmarks
        .filter((elem) => elem.fields.url === 'shape')
        .map(parser);

      const bindings = data.bookmarks
        .filter((elem) => elem.fields.url === 'binding')
        .map(parser);

      // Is this .. sound? TLDraw's multiplayer demo does it like this, but I would much
      // rather update elements by id instead of erasing the whole page
      app.replacePageContent(
        Object.fromEntries(shapes),
        Object.fromEntries(bindings),
        {},
      );
      setElements(elements);
    };
    syncEntries();
  }, [data]);

  return (
    <div className="tldraw">
      <Tldraw
        showPages={false}
        onChangePage={handleTLDrawChange}
        onMount={onMount}
        disableAssets={true}
      />
    </div>
  );
};

export default App;
