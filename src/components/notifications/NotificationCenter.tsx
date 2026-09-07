import React, { useEffect, useState } from "react";
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CircleIcon from "@mui/icons-material/Circle";
import { useNavigate } from "react-router-dom";
import {
  UserNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../../api/myJobBoard/features/notifications/notificationsApi";

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  
  if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return rtf.format(-diffInMinutes, 'minute');
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return rtf.format(-diffInHours, 'hour');
  const diffInDays = Math.floor(diffInHours / 24);
  return rtf.format(-diffInDays, 'day');
};

const NotificationCenter = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // In a real app, you might want to poll this every X minutes or use WebSockets
    const intervalId = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notif: UserNotification) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.linkUrl) {
      navigate(notif.linkUrl);
    }
    handleClose();
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <IconButton color="inherit" sx={{ mx: 1 }} onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon fontSize="large" />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            mt: 1.5,
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          px={2}
          py={1.5}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead} sx={{ textTransform: "none" }}>
              Tout marquer comme lu
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Aucune notification pour le moment.
            </Typography>
          </Box>
        ) : (
          notifications.map((notif) => (
            <MenuItem
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: notif.isRead ? "transparent" : "action.hover",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0.5,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box display="flex" alignItems="center" gap={1} width="100%">
                {!notif.isRead && (
                  <CircleIcon sx={{ fontSize: 10, color: "primary.main" }} />
                )}
                <Typography
                  variant="body2"
                  fontWeight={notif.isRead ? 400 : 600}
                  sx={{
                    whiteSpace: "normal", // allows text to wrap
                    flex: 1,
                  }}
                >
                  {notif.message}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: notif.isRead ? 0 : 2.5 }}
              >
                {formatTimeAgo(notif.createdDate)}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
