import Container from '@commons/components/atom/container';
import { useState } from 'react';
import NonSSRWrapper from '@commons/helpers/no-ssr';
import { useStarx } from '@commons/helpers/use-starx';
import { configs } from '@commons/config/config';

const H = () => {
  const [name, setName] = useState(`guest${Date.now()}`);
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState(0);

  const onMessage = (msg) => {
    setMessages((s) => [...s, msg]);
  };

  const join = (x, data) => {
    if (data.code === 0) {
      setMessages((s) => [...s, { name: 'system', content: data.result }]);

      x.on('onMessage', onMessage);
    }
  };

  const onNewUser = (data) => {
    setMessages((s) => [...s, { name: 'system', content: data.content }]);
  };

  const onMembers = (data) => {
    setMembers((data.members || [0]).join(', '));
  };

  const starx = useStarx({
    host: configs.host,
    port: configs.port,
    path: '/nano',
    onInit: (x) => {
      console.log('initialized');
      x.on('onNewUser', onNewUser);
      x.on('onMembers', onMembers);
      x.request('room.join', { hello: 'world' }, (data) => {
        join(x, data);
      });
    },
  });

  const sendMessage = (e) => {
    e.preventDefault();

    starx.notify('room.message', {
      name,
      content,
    });
    setContent('');
  };

  return (
    <Container className="py-6">
      <div> {members} members</div>

      <div className="font-serif">
        {messages.map((msg) => {
          return (
            // eslint-disable-next-line react/jsx-key
            <div key={msg.name + msg.content}>
              [<span className="text-red-500">{msg.name}</span>]:{msg.content}
            </div>
          );
        })}
      </div>
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-3 p-4 border justify-around my-4"
      >
        <div>{name}</div>
        <input
          value={content || ''}
          onChange={(e) => setContent(e.target.value)}
          className="border bg-gray-200 px-3 py-1 rounded-md bg-transparent"
        />
        <button type="submit" className="bg-blue-800 px-3 py-1">
          send
        </button>
      </form>
    </Container>
  );
};

const Home = () => (
  <NonSSRWrapper>
    <H />
  </NonSSRWrapper>
);

export default Home;
