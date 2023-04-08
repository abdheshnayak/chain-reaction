package main

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/lonng/nano"
	"github.com/lonng/nano/component"
	"github.com/lonng/nano/scheduler"
	"github.com/lonng/nano/serialize/json"
	"github.com/lonng/nano/session"
)

// room
// players

type (
	Room struct {
		group *nano.Group
		Game  Game `json:"game"`
	}

	RoomUser struct {
		roomId   string
		userId   int64
		isOnline bool
		serial   int
		loast    bool
	}

	// RoomManager represents a component that contains a bundle of room
	RoomManager struct {
		component.Base
		timer *scheduler.Timer
		rooms map[string]*Room
		users map[string]*RoomUser
	}

	UserClickInput struct {
		Row int `json:"row"`
		Col int `json:"col"`
	}

	JoinInput struct {
		GameId string    `json:"gameId"`
		User   UserInput `json:"user"`
	}

	Grid struct {
		Cols int `json:"cols"`
		Rows int `json:"rows"`
	}

	CreateInput struct {
		Players int       `json:"players"`
		Grid    Grid      `json:"grid"`
		User    UserInput `json:"user"`
	}

	LandInput struct {
		User UserInput `json:"user"`
	}

	Ball struct {
		Id string `json:"id"`
	}

	GameBlock struct {
		User  int    `json:"user"`
		Balls []Ball `json:"balls"`
	}

	Game struct {
		ID      string        `json:"id"`
		Players int           `json:"players"`
		Data    [][]GameBlock `json:"data"`
		Grid    Grid          `json:"grid"`
		Started bool          `json:"started"`
		User    UserOutput    `json:"user"`
	}

	UserInput struct {
		Email       string `json:"email"`
		Name        string `json:"name"`
		Uid         string `json:"uid"`
		IsAnonymous bool   `json:"isAnonymous"`
	}

	UserOutput struct {
		Email       string `json:"email"`
		Name        string `json:"name"`
		Uid         string `json:"uid"`
		IsAnonymous bool   `json:"isAnonymous"`
		IsOnline    bool   `json:"isOnline"`
		Serial      int    `json:"serial"`
		Lost        bool   `json:"lost"`
	}

	// AllMembers contains all members uid
	AllMembers struct {
		Members map[int64]UserOutput `json:"members"`
	}

	// JoinResponse represents the result of joining room
	JoinResponse struct {
		Code   int    `json:"code"`
		Result string `json:"result"`
	}
)

const (
	roomIDKey = "ROOM_ID"
	LANDING   = "landing"
)

func isLost(room *Room, user int, players int) bool {
	data := room.Game.Data
	balls := 0

	for i := range data {
		for j := range data[i] {
			u := data[i][j]
			balls += len(u.Balls)
			if u.User == user {
				return false
			}
		}
	}

	return balls > players
}

func NewRoomManager() *RoomManager {
	return &RoomManager{
		rooms: map[string]*Room{},
		users: map[string]*RoomUser{},
	}
}

func PushError(s *session.Session, msg string) error {
	s.Push("onError", msg)
	fmt.Println("Error:", msg)
	return fmt.Errorf(msg)
}

// AfterInit component lifetime callback
func (mgr *RoomManager) AfterInit() {
	session.Lifetime.OnClosed(func(s *session.Session) {
		mgr.Close(s, nil)
	})

	// mgr.timer = scheduler.NewTimer(time.Minute, func() {
	// 	for roomId, room := range mgr.rooms {
	// 		println(fmt.Sprintf("UserCount: RoomID=%d, Time=%s, Count=%d",
	// 			roomId, time.Now().String(), room.group.Count()))
	// 	}
	// })
}

func getUser(users map[string]*RoomUser, s *session.Session) UserOutput {
	uid := s.Value("uid").(string)
	return UserOutput{
		Email:       s.Value("email").(string),
		Name:        s.Value("name").(string),
		Uid:         uid,
		IsAnonymous: s.Value("isAnonymous").(bool),
		IsOnline:    users[uid].isOnline,
		Serial:      users[uid].serial,
	}

}

func getMembersOfRoom(users map[string]*RoomUser, room *Room) map[int64]UserOutput {
	maps := map[int64]UserOutput{}
	for _, v := range room.group.Members() {
		s, err := room.group.Member(v)
		if err == nil {
			// fmt.Println(s.Value("isOnline").(string), s.Value("uid").(string))
			uid := s.Value("uid").(string)
			maps[v] = UserOutput{
				Email:       s.Value("email").(string),
				Name:        s.Value("name").(string),
				Uid:         uid,
				IsAnonymous: s.Value("isAnonymous").(bool),
				IsOnline:    users[uid].isOnline,
				Serial:      users[uid].serial,
				Lost:        users[uid].loast,
			}
		}
	}

	return maps
}

func getMd5(s string) string {
	hash := md5.Sum([]byte(s))
	return hex.EncodeToString(hash[:])
}

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyz1234567890")

func RandStringRunes(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}

// Join room
func (mgr *RoomManager) Land(s *session.Session, landInput *LandInput) error {

	var room *Room

	rId := "landing"

	var fakeUID int64
	uid := landInput.User.Uid
	var serial int
	if mgr.users[uid] != nil {
		usr := mgr.users[uid]
		rId = usr.roomId
		fakeUID = usr.userId
		serial = usr.serial
	} else {
		fakeUID = s.ID() //just use s.ID as uid !!!
		serial = 0
	}

	if mgr.rooms[rId] == nil {
		room = &Room{
			group: nano.NewGroup(fmt.Sprint(rId)),
		}
		mgr.rooms[rId] = room
	} else {
		room = mgr.rooms[rId]
	}

	fmt.Println("going online")
	mgr.users[uid] = &RoomUser{
		roomId:   rId,
		userId:   fakeUID,
		isOnline: true,
		serial:   serial,
	}

	s.Bind(fakeUID) // binding session uids.Set(roomIDKey, room)
	s.Set(roomIDKey, room)
	s.Set("email", landInput.User.Email)
	s.Set("name", landInput.User.Name)
	s.Set("uid", landInput.User.Uid)
	s.Set("isAnonymous", landInput.User.IsAnonymous)
	s.Set("roomId", rId)

	room.group.Add(s) // add session to group

	allMembers := getMembersOfRoom(mgr.users, room)
	room.group.Broadcast("onMembers", &AllMembers{Members: allMembers})

	// s.Push("onMembers", &AllMembers{Members: allMembers})

	if rId != LANDING {
		s.Push("onGame", room.Game)
	}

	// notify others
	room.group.Broadcast("onNewUser", landInput)
	// new user join group
	return s.Response(&JoinResponse{Result: "success"})
}

// Join room
func (mgr *RoomManager) Create(s *session.Session, createInput *CreateInput) error {

	usr := createInput.User

	var room *Room

	var rId string
	for {
		rId = RandStringRunes(5)

		if mgr.rooms[rId] == nil {
			break
		}
	}

	room = &Room{
		group: nano.NewGroup(fmt.Sprint(rId)),
	}

	if mgr.users[usr.Uid] == nil {
		return PushError(s, "no user found in landing room")
	}

	rUser := mgr.users[usr.Uid]

	mgr.users[usr.Uid] = &RoomUser{
		roomId:   rId,
		userId:   rUser.userId,
		isOnline: true,
		serial:   len(getMembersOfRoom(mgr.users, room)),
	}

	data := make([][]GameBlock, createInput.Grid.Rows)
	for i := range data {
		data[i] = make([]GameBlock, createInput.Grid.Cols)
		for i2 := range data[i] {
			data[i][i2] = GameBlock{
				User:  999,
				Balls: []Ball{},
			}
		}
	}

	room.Game = Game{
		Players: createInput.Players,
		ID:      rId,
		Data:    data,
		Grid:    createInput.Grid,
		User:    getUser(mgr.users, s),
	}

	mgr.rooms[rId] = room

	landRoom := mgr.rooms[LANDING]

	landRoom.group.Leave(s) // del session from group
	room.group.Add(s)       // add session to group

	allMembers := getMembersOfRoom(mgr.users, room)

	// s.Push("onMembers", &AllMembers{Members: allMembers})
	s.Push("onGame", room.Game)

	// notify others
	room.group.Broadcast("onMembers", &AllMembers{Members: allMembers})
	landRoom.group.Broadcast("onMembers", &AllMembers{Members: getMembersOfRoom(mgr.users, landRoom)})

	return s.Response(&JoinResponse{Result: "success"})
}

func addBall(room *Room, row, col int, ball Ball, rUser *RoomUser) {

	executeBlock(room, &UserClickInput{
		Row: row,
		Col: col,
	}, rUser, &ball)

}

func doWithCorner(room *Room, row, col int, rUser *RoomUser) {
	data := room.Game.Data

	balls := data[row][col].Balls

	gridRow := len(data)
	gridCol := len(data[0])

	a, b := balls[0], balls[1]

	room.Game.Data[row][col] = GameBlock{
		User:  999,
		Balls: []Ball{},
	}

	if row == 0 {
		addBall(room, row+1, col, a, rUser)
	} else if row == gridRow-1 {
		addBall(room, row-1, col, a, rUser)
	}

	if col == 0 {
		addBall(room, row, col+1, b, rUser)
	} else if col == gridCol-1 {
		addBall(room, row, col-1, b, rUser)
	}

}

func doWithSide(room *Room, row, col int, rUser *RoomUser) {
	data := room.Game.Data

	balls := data[row][col].Balls

	gridRow := len(data)
	gridCol := len(data[0])

	a, b, c := balls[0], balls[1], balls[2]

	room.Game.Data[row][col] = GameBlock{
		User:  999,
		Balls: []Ball{},
	}

	if row == 0 || row == gridRow-1 {
		addBall(room, row, col+1, a, rUser)
		addBall(room, row, col-1, b, rUser)
		// setRCBlock(row, col + 1, (i) => [...i, a], user);
		// setRCBlock(row, col - 1, (i) => [...i, b], user);
		if row == 0 {
			addBall(room, row+1, col, c, rUser)
			// setRCBlock(row + 1, col, (i) => [...i, c], user);
		} else {
			addBall(room, row-1, col, c, rUser)
			// setRCBlock(row - 1, col, (i) => [...i, c], user);
		}
	} else if col == 0 || col == gridCol-1 {
		addBall(room, row+1, col, a, rUser)
		addBall(room, row-1, col, b, rUser)
		// setRCBlock(row + 1, col, (i) => [...i, a], user);
		// setRCBlock(row - 1, col, (i) => [...i, b], user);

		if col == 0 {
			addBall(room, row, col+1, c, rUser)
			// setRCBlock(row, col + 1, (i) => [...i, c], user);
		} else {
			addBall(room, row, col-1, c, rUser)
			// setRCBlock(row, col - 1, (i) => [...i, c], user);
		}
	}

}

func doWithCenter(room *Room, row, col int, rUser *RoomUser) {

	data := room.Game.Data

	balls := data[row][col].Balls

	a, b, c, d := balls[0], balls[1], balls[2], balls[3]

	room.Game.Data[row][col] = GameBlock{
		User:  999,
		Balls: []Ball{},
	}

	addBall(room, row-1, col, a, rUser)
	addBall(room, row+1, col, b, rUser)
	addBall(room, row, col-1, c, rUser)
	addBall(room, row, col+1, d, rUser)

}

func executeBlock(room *Room, clickInput *UserClickInput, rUser *RoomUser, ball *Ball) {
	Game := room.Game.Data[clickInput.Row][clickInput.Col]

	gridRow := room.Game.Grid.Rows
	gridCol := room.Game.Grid.Cols

	isCorner := func(row, col int) bool {
		return (row == 0 || row == gridRow-1) && (col == 0 || col == gridCol-1)
	}

	isSide := func(row, col int) bool {
		return row == 0 || row == gridRow-1 || col == 0 || col == gridCol-1
	}

	isCenter := func(row, col int) bool {
		return !isSide(row, col) && !isCorner(row, col)
	}

	room.Game.Data[clickInput.Row][clickInput.Col] = GameBlock{
		User: rUser.serial,
		Balls: func() []Ball {

			balls := []Ball{}

			balls = append(balls, Game.Balls...)
			if ball != nil {
				balls = append(balls, *ball)
			} else {
				balls = append(balls,

					Ball{
						Id: RandStringRunes(10),
					},
				)
			}

			return balls
		}(),
	}

	room.group.Broadcast("onGame", room.Game)

	Game = room.Game.Data[clickInput.Row][clickInput.Col]

	row := clickInput.Row
	col := clickInput.Col

	// time.Sleep(time.Microsecond * 100)
	if isCorner(row, col) && len(Game.Balls) == 2 {
		doWithCorner(room, row, col, rUser)
	} else if isSide(row, col) && len(Game.Balls) == 3 {
		doWithSide(room, row, col, rUser)
	} else if isCenter(row, col) && len(Game.Balls) == 4 {
		doWithCenter(room, row, col, rUser)
	}

	room.group.Broadcast("onGame", room.Game)

}

func (mgr *RoomManager) Click(s *session.Session, clickInput *UserClickInput) error {

	uid := s.Value("uid").(string)

	rUser, ok := mgr.users[uid]
	if !ok {
		return PushError(s, "no user found")
	}

	room, ok := mgr.rooms[rUser.roomId]
	if !ok {
		return PushError(s, "no Game found with provided GameId")
	}

	if rUser.loast {
		return PushError(s, "you lost")
	}

	if room.Game.User.Serial != rUser.serial {
		return PushError(s, "it's not your turn")
	}

	Game := room.Game.Data[clickInput.Row][clickInput.Col]
	if Game.User != rUser.serial && len(Game.Balls) != 0 {
		return PushError(s, "it's not your block")
	}

	executeBlock(room, clickInput, rUser, nil)

	m := getMembersOfRoom(mgr.users, room)

	getUserOfSerial := func(users map[int64]UserOutput, serial int) (*UserOutput, error) {

		for _, uo := range users {
			if uo.Serial == serial {
				return &uo, nil
			}
		}
		return nil, fmt.Errorf("user not found")
	}

	serial := 0

	for {

		if len(m)-1 == rUser.serial {
			serial = 0
		} else {
			serial = serial + 1
		}

		if len(m)-1 < serial {
			serial = 0
		}

		if serial == rUser.serial {
			uo, _ := getUserOfSerial(m, rUser.serial)
			room.group.Broadcast("onWinner", uo)
			clearRoom(mgr, room)
			delete(mgr.rooms, rUser.roomId)
			return s.Response(&JoinResponse{Result: "success"})
		}

		fmt.Println("lost", serial)

		if isLost(room, serial, room.Game.Players) {
			uo, _ := getUserOfSerial(m, serial)
			u := mgr.users[uo.Uid]
			mgr.users[uid] = &RoomUser{
				roomId:   u.roomId,
				userId:   u.userId,
				isOnline: u.isOnline,
				serial:   u.serial,
				loast:    true,
			}
			m = getMembersOfRoom(mgr.users, room)
		} else {
			break
		}

	}

	uo, err := getUserOfSerial(m, serial)
	if err != nil {
		return PushError(s, err.Error())
	}

	room.Game.User = *uo

	room.group.Broadcast("onGame", room.Game)

	return s.Response(&JoinResponse{Result: "success"})
}

func (mgr *RoomManager) Start(s *session.Session, msg []byte) error {

	var room *Room

	rId := "landing"

	uid := s.Value("uid").(string)

	if uid == "" {
		return PushError(s, "can't find userid from session")
	}

	if mgr.users[uid] != nil {
		rId = mgr.users[uid].roomId
	} else {
		return PushError(s, "can't find user session")
	}

	if mgr.rooms[rId] != nil {
		room = mgr.rooms[rId]
	} else {
		return PushError(s, "can't room user session")
	}

	game := room.Game
	room.Game = Game{
		ID:      game.ID,
		Players: game.Players,
		Data:    game.Data,
		Grid:    game.Grid,
		Started: true,
		User:    getUser(mgr.users, s),
	}

	room.group.Broadcast("onGame", room.Game)

	return s.Response(&JoinResponse{Result: "success"})
}

// Join room
func (mgr *RoomManager) Join(s *session.Session, joinInput *JoinInput) error {

	usr := joinInput.User

	// NOTE: join test room only in demo

	rUser, ok := mgr.users[usr.Uid]
	if !ok {
		return PushError(s, "no user found")
	}

	rId := joinInput.GameId

	room, ok := mgr.rooms[rId]
	if !ok {
		return PushError(s, "no Game found with provided GameId")
	}

	fmt.Println("----------------", room.Game.Players, len(room.group.Members()), room.group.Members())

	if room.Game.Players <= len(getMembersOfRoom(mgr.users, room)) {
		return PushError(s, "game already full")
	}

	mgr.users[usr.Uid] = &RoomUser{
		roomId:   rId,
		userId:   rUser.userId,
		isOnline: true,
		serial:   len(getMembersOfRoom(mgr.users, room)),
	}

	landRoom := mgr.rooms[LANDING]

	room.group.Add(s) // add session to group
	landRoom.group.Leave(s)

	allMembers := getMembersOfRoom(mgr.users, room)

	room.group.Broadcast("onMembers", &AllMembers{Members: allMembers})
	landRoom.group.Broadcast("onMembers", &AllMembers{Members: getMembersOfRoom(mgr.users, landRoom)})

	s.Push("onMembers", &AllMembers{Members: allMembers})

	s.Push("onGame", room.Game)

	// notify others
	room.group.Broadcast("onNewUser", joinInput)
	// new user join group

	if len(room.group.Members()) == room.Game.Players {
		s.Push("onGameStarted", room.Game)
	}

	return s.Response(&JoinResponse{Result: "success"})
}

// // Message sync last message to all members
// func (mgr *RoomManager) Message(s *session.Session, msg *UserMessage) error {
// 	if !s.HasKey(roomIDKey) {
// 		return fmt.Errorf("not join room yet")
// 	}
// 	room := s.Value(roomIDKey).(*Room)
//
// 	if !s.HasKey("email") {
// 		return fmt.Errorf("can't find email")
// 	}
//
// 	if s.Value("email").(string) != msg.Email {
// 		return fmt.Errorf("unauthorized")
// 	}
//
// 	return room.group.Broadcast("onMessage", &UserMessageBrodCast{
// 		Name:    msg.Name,
// 		Content: msg.Content,
// 		Id:      s.ID(),
// 	})
// }

func clearRoom(mgr *RoomManager, room *Room) {
	for _, v := range getMembersOfRoom(mgr.users, room) {
		delete(mgr.users, v.Uid)
	}
}

func (mgr *RoomManager) Close(s *session.Session, msg []byte) error {

	if !s.HasKey(roomIDKey) {
		return nil
	}

	rId := s.Value("roomId").(string)

	room := s.Value(roomIDKey).(*Room)

	if rId == LANDING {
		room.group.Leave(s)
	} else {
		uid := s.Value("uid").(string)
		mgr.users[uid].isOnline = false
	}

	room.group.Broadcast("onMembers",
		&AllMembers{Members: getMembersOfRoom(mgr.users, room)},
	)

	if len(room.group.Members()) == 0 {
		delete(mgr.rooms, rId)
	}

	return nil
}

func main() {
	components := &component.Components{}
	components.Register(
		NewRoomManager(),
		component.WithName("room"), // rewrite component and handler name
		component.WithNameFunc(strings.ToLower),
	)

	http.Handle("/*", http.FileServer(http.Dir("out")))
	http.Handle("/", http.StripPrefix("/", http.FileServer(http.Dir("out"))))

	nano.Listen(":3250",
		nano.WithIsWebsocket(true),
		nano.WithCheckOriginFunc(func(_ *http.Request) bool { return true }),
		nano.WithWSPath("/server"),
		nano.WithDebugMode(),
		nano.WithSerializer(json.NewSerializer()), // override default serializer
		nano.WithComponents(components),
		nano.WithHeartbeatInterval(time.Second),
		// nano.WithLogger(log.New(&bytes.Buffer{}, "hi", log.Flags())),
	)
}
