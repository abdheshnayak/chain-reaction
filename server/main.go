package main

import (
	// "bytes"
	// "log"
	"fmt"
	"net/http"
	"strings"
	"time"

	// "time"

	"github.com/lonng/nano"
	"github.com/lonng/nano/component"
	"github.com/lonng/nano/scheduler"
	"github.com/lonng/nano/serialize/json"
	"github.com/lonng/nano/session"
)

type (
	Room struct {
		group *nano.Group
	}

	// RoomManager represents a component that contains a bundle of room
	RoomManager struct {
		component.Base
		timer *scheduler.Timer
		rooms map[int]*Room
	}

	// UserMessage represents a message that user sent
	UserMessage struct {
		Email   string `json:"email"`
		Name    string `json:"name"`
		Content string `json:"content"`
	}

	// UserMessage represents a message that user sent
	UserMessageBrodCast struct {
		Name    string `json:"name"`
		Content string `json:"content"`
		Id      int64  `json:"id"`
	}

	// User message will be received when new user join room
	User struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}

	// AllMembers contains all members uid
	AllMembers struct {
		Members map[int64]string `json:"members"`
	}

	// JoinResponse represents the result of joining room
	JoinResponse struct {
		Code   int    `json:"code"`
		Result string `json:"result"`
	}
)

const (
	testRoomID = 1
	roomIDKey  = "ROOM_ID"
)

func NewRoomManager() *RoomManager {
	return &RoomManager{
		rooms: map[int]*Room{},
	}
}

// AfterInit component lifetime callback
func (mgr *RoomManager) AfterInit() {
	session.Lifetime.OnClosed(func(s *session.Session) {
		if !s.HasKey(roomIDKey) {
			return
		}
		room := s.Value(roomIDKey).(*Room)
		room.group.Leave(s)

		room.group.Broadcast("onMembers",
			&AllMembers{Members: getMembersOfRoom(room)},
		)
	})

	// mgr.timer = scheduler.NewTimer(time.Minute, func() {
	// 	for roomId, room := range mgr.rooms {
	// 		println(fmt.Sprintf("UserCount: RoomID=%d, Time=%s, Count=%d",
	// 			roomId, time.Now().String(), room.group.Count()))
	// 	}
	// })
}
func getMembersOfRoom(room *Room) map[int64]string {
	maps := map[int64]string{}
	for _, v := range room.group.Members() {
		s2, err := room.group.Member(v)
		if err == nil && s2.HasKey("email") {
			email := s2.Value("email")
			maps[v] = email.(string)
		}
	}

	return maps
}

// Join room
func (mgr *RoomManager) Join(s *session.Session, msg []byte) error {
	var usr User

	if err := json.NewSerializer().Unmarshal(msg, &usr); err != nil {
		return err
	}

	// NOTE: join test room only in demo
	room, found := mgr.rooms[testRoomID]
	if !found {
		room = &Room{
			group: nano.NewGroup(fmt.Sprintf("room-%d", testRoomID)),
		}
		mgr.rooms[testRoomID] = room
	}

	fakeUID := s.ID() //just use s.ID as uid !!!
	s.Bind(fakeUID)   // binding session uids.Set(roomIDKey, room)
	s.Set(roomIDKey, room)
	s.Set("email", usr.Email)

	allMembers := getMembersOfRoom(room)
	allMembers[fakeUID] = usr.Email

	room.group.Broadcast("onMembers", &AllMembers{Members: allMembers})
	s.Push("onMembers", &AllMembers{Members: allMembers})
	// notify others
	room.group.Broadcast("onNewUser", usr)
	// new user join group
	room.group.Add(s) // add session to group
	return s.Response(&JoinResponse{Result: "success"})
}

// Message sync last message to all members
func (mgr *RoomManager) Message(s *session.Session, msg *UserMessage) error {
	if !s.HasKey(roomIDKey) {
		return fmt.Errorf("not join room yet")
	}
	room := s.Value(roomIDKey).(*Room)

	if !s.HasKey("email") {
		return fmt.Errorf("can't find email")
	}

	if s.Value("email").(string) != msg.Email {
		return fmt.Errorf("unauthorized")
	}

	return room.group.Broadcast("onMessage", &UserMessageBrodCast{
		Name:    msg.Name,
		Content: msg.Content,
		Id:      s.ID(),
	})
}

func (mgr *RoomManager) Close(s *session.Session, msg []byte) error {
	if !s.HasKey(roomIDKey) {
		return nil
	}
	room := s.Value(roomIDKey).(*Room)
	room.group.Leave(s)

	room.group.Broadcast("onMembers",
		&AllMembers{Members: getMembersOfRoom(room)},
	)

	return nil
}

func main() {
	components := &component.Components{}
	components.Register(
		NewRoomManager(),
		component.WithName("room"), // rewrite component and handler name
		component.WithNameFunc(strings.ToLower),
	)

	nano.Listen(":3250",
		nano.WithIsWebsocket(true),
		nano.WithCheckOriginFunc(func(_ *http.Request) bool { return true }),
		nano.WithWSPath("/nano"),
		nano.WithDebugMode(),
		nano.WithSerializer(json.NewSerializer()), // override default serializer
		nano.WithComponents(components),
		nano.WithHeartbeatInterval(time.Second),
		// nano.WithLogger(log.New(&bytes.Buffer{}, "hi", log.Flags())),
	)

}
