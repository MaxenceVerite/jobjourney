import React from "react";
import { Grid, Paper, Box, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', 
      }}
    >
      <Paper
        sx={{
          boxShadow: '5px 10px 15px 0 rgba(0,0,0,0.07)',
          width: "70%",
          display: 'flex',
          alignItems: 'center',
          height: "75vh"
        }}
      >
        <Grid height="100%" container>
        <Grid item xs={12} md={6}  >
       
        <Outlet />
        </Grid>
        <Grid
        item
        lg={6}
        sx={(theme) => ({
          backgroundImage: `linear-gradient(160deg, ${theme.palette.primary.main} 30%, ${theme.palette.success.main} 90%)`, /* Replace with your gradient */
          display: 'flex', // Make this a flex container
          maxHeight: '100%'
        })}
      >
        <Grid item lg={6} marginLeft="9%" marginTop="4%" 
        sx={{
          display: { xs: 'none', md: 'none', lg:'flex'}}
        }
        >
        <Typography variant="h2" sx={{ fontWeight:"400", color: 'white', textAlign: 'center', padding: 4 }}>
          
        </Typography>
        </Grid>
        
      </Grid>
       </Grid>
      </Paper>
    </Box>
  );
};

export default AuthLayout;
