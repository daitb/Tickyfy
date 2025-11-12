import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

interface WaitlistProps {
  onNavigate?: (page: string) => void;
}

interface WaitlistEntry {
  waitlistId: number;
  eventId: number;
  eventTitle: string;
  eventImage: string;
  eventStartDate: string;
  eventEndDate: string;
  eventVenue: string;
  eventCity: string;
  category: string;
  position: number;
  totalWaitlisted: number;
  joinedAt: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  status: "Active" | "Notified" | "Expired";
  notifiedAt?: string;
}

export function Waitlist({ onNavigate }: WaitlistProps) {
  const navigate = useNavigate();
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/waitlist', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();

      // Mock data for now
      const mockWaitlist: WaitlistEntry[] = [
        {
          waitlistId: 1,
          eventId: 2,
          eventTitle: "Tech Conference 2025",
          eventImage:
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
          eventStartDate: "2026-01-15T09:00:00",
          eventEndDate: "2026-01-17T18:00:00",
          eventVenue: "Convention Center",
          eventCity: "San Francisco",
          category: "Conference",
          position: 15,
          totalWaitlisted: 78,
          joinedAt: "2025-11-08T10:30:00",
          emailNotifications: true,
          smsNotifications: false,
          status: "Active",
        },
        {
          waitlistId: 2,
          eventId: 4,
          eventTitle: "Broadway Show - Hamilton",
          eventImage:
            "https://images.unsplash.com/photo-1503095396549-807759245b35",
          eventStartDate: "2025-12-15T19:00:00",
          eventEndDate: "2025-12-15T22:00:00",
          eventVenue: "Broadway Theatre",
          eventCity: "New York",
          category: "Theatre",
          position: 3,
          totalWaitlisted: 42,
          joinedAt: "2025-11-10T14:15:00",
          emailNotifications: true,
          smsNotifications: true,
          status: "Active",
        },
        {
          waitlistId: 3,
          eventId: 5,
          eventTitle: "NBA Finals Game 7",
          eventImage:
            "https://images.unsplash.com/photo-1546519638-68e109498ffc",
          eventStartDate: "2026-06-20T20:30:00",
          eventEndDate: "2026-06-20T23:00:00",
          eventVenue: "Madison Square Garden",
          eventCity: "New York",
          category: "Sports",
          position: 127,
          totalWaitlisted: 324,
          joinedAt: "2025-11-05T09:00:00",
          emailNotifications: true,
          smsNotifications: true,
          status: "Notified",
          notifiedAt: "2025-11-10T16:45:00",
        },
      ];

      setWaitlistEntries(mockWaitlist);
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWaitlist = async (waitlistId: number) => {
    if (!confirm("Leave this waitlist? You will lose your position.")) return;

    try {
      setUpdatingId(waitlistId);
      // TODO: Replace with actual API call
      // await fetch(`/api/waitlist/${waitlistId}`, {
      //   method: 'DELETE',
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      setWaitlistEntries((prev) =>
        prev.filter((e) => e.waitlistId !== waitlistId)
      );
    } catch (error) {
      console.error("Error leaving waitlist:", error);
      alert("Failed to leave waitlist. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleNotification = async (
    waitlistId: number,
    type: "email" | "sms",
    currentValue: boolean
  ) => {
    try {
      setUpdatingId(waitlistId);
      // TODO: Replace with actual API call
      // await fetch(`/api/waitlist/${waitlistId}/notifications`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ [type]: !currentValue })
      // });

      setWaitlistEntries((prev) =>
        prev.map((entry) =>
          entry.waitlistId === waitlistId
            ? {
                ...entry,
                [`${type}Notifications`]: !currentValue,
              }
            : entry
        )
      );
    } catch (error) {
      console.error("Error updating notification settings:", error);
      alert("Failed to update notification settings. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewEvent = (eventId: number) => {
    if (onNavigate) {
      onNavigate(`/event/${eventId}`);
    } else {
      navigate(`/event/${eventId}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Notified":
        return "bg-green-100 text-green-800 border-green-200";
      case "Expired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPositionBadgeColor = (position: number, total: number) => {
    const percentile = (position / total) * 100;
    if (percentile <= 10) return "bg-green-500 text-white";
    if (percentile <= 30) return "bg-yellow-500 text-white";
    return "bg-gray-500 text-white";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">My Waitlist</h1>
          <p className="text-neutral-600">
            Events you're waiting for • {waitlistEntries.length}{" "}
            {waitlistEntries.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        {/* Info Banner */}
        {waitlistEntries.some((e) => e.status === "Notified") && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium text-green-900">Tickets Available!</p>
                <p className="text-sm text-green-700 mt-1">
                  Some events on your waitlist now have tickets available. Book
                  them before they're gone!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Waitlist Grid */}
        {waitlistEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <svg
                className="w-24 h-24 text-neutral-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-medium text-neutral-700 mb-2">
                No waitlist entries
              </p>
              <p className="text-neutral-500 mb-6 text-center max-w-md">
                When you join a waitlist for sold-out events, they'll appear
                here. We'll notify you when tickets become available!
              </p>
              <Button onClick={() => navigate("/events")}>
                Explore Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {waitlistEntries.map((entry) => (
              <Card
                key={entry.waitlistId}
                className={`overflow-hidden ${
                  entry.status === "Notified"
                    ? "border-green-300 shadow-md"
                    : ""
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Event Image */}
                  <div className="md:w-48 h-48 md:h-auto overflow-hidden flex-shrink-0">
                    <img
                      src={entry.eventImage}
                      alt={entry.eventTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="text-xs">{entry.category}</Badge>
                          <Badge className={getStatusColor(entry.status)}>
                            {entry.status}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          {entry.eventTitle}
                        </h3>
                      </div>
                    </div>

                    {/* Date and Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formatDate(entry.eventStartDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>
                          {entry.eventVenue}, {entry.eventCity}
                        </span>
                      </div>
                    </div>

                    {/* Position Info */}
                    <div className="bg-neutral-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-neutral-600">
                          Your Position
                        </span>
                        <Badge
                          className={getPositionBadgeColor(
                            entry.position,
                            entry.totalWaitlisted
                          )}
                        >
                          #{entry.position}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-neutral-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.max(
                                5,
                                (entry.position / entry.totalWaitlisted) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-neutral-500">
                          {entry.totalWaitlisted} total
                        </span>
                      </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-neutral-700 mb-3">
                        Notification Preferences
                      </p>
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`email-${entry.waitlistId}`}
                            checked={entry.emailNotifications}
                            onCheckedChange={() =>
                              handleToggleNotification(
                                entry.waitlistId,
                                "email",
                                entry.emailNotifications
                              )
                            }
                            disabled={updatingId === entry.waitlistId}
                          />
                          <Label
                            htmlFor={`email-${entry.waitlistId}`}
                            className="text-sm cursor-pointer"
                          >
                            Email notifications
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`sms-${entry.waitlistId}`}
                            checked={entry.smsNotifications}
                            onCheckedChange={() =>
                              handleToggleNotification(
                                entry.waitlistId,
                                "sms",
                                entry.smsNotifications
                              )
                            }
                            disabled={updatingId === entry.waitlistId}
                          />
                          <Label
                            htmlFor={`sms-${entry.waitlistId}`}
                            className="text-sm cursor-pointer"
                          >
                            SMS notifications
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Status Info */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">
                        Joined {formatDateTime(entry.joinedAt)}
                      </span>
                      {entry.notifiedAt && (
                        <span className="text-green-600 font-medium">
                          Notified {formatDateTime(entry.notifiedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 md:w-48 flex md:flex-col gap-2 border-t md:border-t-0 md:border-l">
                    {entry.status === "Notified" ? (
                      <Button
                        className="flex-1 md:w-full"
                        onClick={() => handleViewEvent(entry.eventId)}
                      >
                        Book Now
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="flex-1 md:w-full"
                        onClick={() => handleViewEvent(entry.eventId)}
                      >
                        View Event
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="flex-1 md:w-full"
                      onClick={() => handleLeaveWaitlist(entry.waitlistId)}
                      disabled={updatingId === entry.waitlistId}
                    >
                      Leave Waitlist
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Footer */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-3">
              How Waitlists Work
            </h3>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  You'll be notified immediately when tickets become available
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Your position updates as people ahead of you get tickets or
                  leave the waitlist
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  You have 24 hours to complete your purchase once notified
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Manage your notification preferences anytime to stay updated
                  your way
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
