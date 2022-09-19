create table if not exists Users (
	chatId integer unique,
	name text,
	id text primary key
);

create table if not exists Subscribers (
	id text primary key,
	start integer,
	end integer,
	currentMeditationId integer
);

create table if not exists Subscription_history (
	id text primary key,
	level integer,
	start integer,
	end integer
);

create table if not exists Admins (
  id text primary key
);

create table if not exists Transactions (
  id integer primary key,
  sum integer,
  userid text
)
