import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

actor {
  type Message = {
    alias : Text;
    content : Text;
    timestamp : Time.Time;
  };

  let messages = List.empty<Message>();
  let maxMessages = 200;

  public shared ({ caller }) func postMessage(alias : Text, content : Text) : async () {
    let newMessage : Message = {
      alias;
      content;
      timestamp = Time.now();
    };

    if (messages.size() >= maxMessages) {
      ignore messages.removeLast();
    };
    messages.add(newMessage);
  };

  public query ({ caller }) func getAllMessages() : async [Message] {
    messages.toArray().reverse();
  };
};
